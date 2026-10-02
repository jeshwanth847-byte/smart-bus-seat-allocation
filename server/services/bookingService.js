import { Booking, SeatLock, Notification } from '../models/index.js';
import { allocate, checkManual } from './allocation.js';

const fail = (status, message, extra = {}) => Object.assign(new Error(message), { status, ...extra });
export const takenSeats = async (bus, date) => new Set((await SeatLock.find({ bus, date })).map((l) => l.seat));

export async function createBooking({ user, bus, date, passengers, mode, confirmWarnings }) {
  if (await Booking.findOne({ user: user._id, bus: bus._id, date, status: 'confirmed' })) throw fail(409, 'You already have a booking on this bus for this date');
  const taken = await takenSeats(bus._id, date);
  let result;
  if (mode === 'manual') {
    const chosen = new Set(), warnings = [];
    result = passengers.map((p) => {
      const r = checkManual(p, p.seat, bus);
      if (!r) throw fail(400, `Seat ${p.seat || '(none)'} is invalid or under maintenance`);
      if (taken.has(r.seat) || chosen.has(r.seat)) throw fail(409, `Seat ${r.seat} is already taken`);
      chosen.add(r.seat);
      r.warnings.forEach((w) => warnings.push(`${p.name} - seat ${r.seat}: ${w}`));
      return { passenger: p, ...r };
    });
    if (warnings.length && !confirmWarnings) throw fail(409, 'Seat selection conflicts with passenger needs', { warnings });
  } else result = allocate(passengers, bus, taken);

  const seatNumbers = result.map((r) => r.seat);
  const booking = new Booking({
    bookingId: 'SB' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 99),
    user: user._id, bus: bus._id, date, seatNumbers,
    passengers: result.map((r) => ({ ...r.passenger, seat: r.seat, score: r.score, reasons: r.reasons })),
    totalAmount: bus.price * result.length, allocationMode: mode === 'manual' ? 'manual' : 'smart',
    allocationScore: Math.round(result.reduce((a, r) => a + r.score, 0) / result.length),
  });
  try {
    await SeatLock.insertMany(seatNumbers.map((seat) => ({ bus: bus._id, date, seat, booking: booking._id })));
  } catch (e) {
    await SeatLock.deleteMany({ booking: booking._id });
    throw fail(409, 'A seat was just booked by someone else. Please try again.');
  }
  await booking.save();
  await Notification.insertMany([
    { user: user._id, type: 'booking_confirmed', message: `Booking ${booking.bookingId} confirmed` },
    { user: user._id, type: 'seat_allocated', message: `Seats ${seatNumbers.join(', ')} allocated on ${bus.busName}` },
  ]);
  return { booking, result };
}
