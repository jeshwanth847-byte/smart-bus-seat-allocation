import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Bus, Booking, SeatLock, Notification } from '../models/index.js';
import { auth, role } from '../middleware/auth.js';
import { allocate, buildSeats, priorityOf } from '../services/allocation.js';
import { createBooking, takenSeats } from '../services/bookingService.js';

const r = Router();
const h = (fn) => (req, res, next) => fn(req, res, next).catch(next);
const bad = (message, status = 400) => Object.assign(new Error(message), { status });
const TYPES = ['normal', 'senior', 'child', 'pregnant', 'disability', 'student'];
const token = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const today = () => new Date().toISOString().slice(0, 10);
const esc = (s) => s.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function checkPassengers(list, date) {
  if (!Array.isArray(list) || list.length < 1 || list.length > 6) throw bad('Add between 1 and 6 passengers');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || date < today()) throw bad('Choose a valid travel date (today or later)');
  list.forEach((p, i) => {
    if (!p.name?.trim()) throw bad(`Passenger ${i + 1}: name is required`);
    if (p.age === '' || !(+p.age >= 0 && +p.age <= 120)) throw bad(`Passenger ${i + 1}: enter a valid age`);
    if (!TYPES.includes(p.passengerType)) throw bad(`Passenger ${i + 1}: invalid passenger type`);
    p.age = +p.age;
  });
}

// ---- Auth ----
r.post('/auth/register', h(async (req, res) => {
  const { name, email, password, phone, age, gender, passengerType, accessibilityRequirement, seatPreference } = req.body;
  const cleanEmail = (email || '').toLowerCase().trim();
  if (!name || !/^\S+@\S+\.\S+$/.test(cleanEmail)) throw bad('Name and a valid email are required');
  if ((password || '').length < 6) throw bad('Password must be at least 6 characters');
  if (await User.findOne({ email: cleanEmail })) throw bad('Email already registered', 409);
  const parsedAge = age !== undefined && age !== '' && !isNaN(Number(age)) ? Number(age) : undefined;
  const user = await User.create({
    name: name.trim(),
    email: cleanEmail,
    phone: phone ? phone.trim() : undefined,
    age: parsedAge,
    gender: gender || 'male',
    passengerType: passengerType || 'normal',
    accessibilityRequirement: accessibilityRequirement || 'none',
    seatPreference: seatPreference || 'any',
    password: await bcrypt.hash(password, 10)
  });
  res.status(201).json({ token: token(user), user: { ...user.toObject(), password: undefined } });
}));
r.post('/auth/login', h(async (req, res) => {
  const user = await User.findOne({ email: (req.body.email || '').toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) throw bad('Invalid email or password', 401);
  res.json({ token: token(user), user: { ...user.toObject(), password: undefined } });
}));

// ---- Users ----
r.get('/users/profile', auth, (req, res) => res.json(req.user));
r.put('/users/profile', auth, h(async (req, res) => {
  ['name', 'phone', 'age', 'gender', 'passengerType', 'accessibilityRequirement', 'seatPreference'].forEach((k) => req.body[k] !== undefined && (req.user[k] = req.body[k]));
  await req.user.save();
  res.json(req.user);
}));

// ---- Buses ----
r.get('/buses', h(async (req, res) => {
  const { source, destination, date, passengers } = req.query;
  const q = {};
  if (source) q.source = new RegExp(`^${esc(source)}$`, 'i');
  if (destination) q.destination = new RegExp(`^${esc(destination)}$`, 'i');
  const out = [];
  for (const b of await Bus.find(q)) {
    const total = b.rows * b.cols.length - b.maintenanceSeats.length;
    const available = total - (date ? await SeatLock.countDocuments({ bus: b._id, date }) : 0);
    if (!passengers || available >= +passengers) out.push({ ...b.toObject(), totalSeats: total, availableSeats: available });
  }
  res.json(out);
}));
r.post('/buses', auth, role('operator', 'admin'), h(async (req, res) => res.status(201).json(await Bus.create({ ...req.body, operator: req.user._id }))));
r.put('/buses/:id', auth, role('operator', 'admin'), h(async (req, res) => {
  const b = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!b) throw bad('Bus not found', 404);
  res.json(b);
}));
r.delete('/buses/:id', auth, role('operator', 'admin'), h(async (req, res) => {
  if (!(await Bus.findByIdAndDelete(req.params.id))) throw bad('Bus not found', 404);
  res.json({ message: 'Bus removed' });
}));

// ---- Seats ----
r.get('/buses/:id/seats', h(async (req, res) => {
  const bus = await Bus.findById(req.params.id).catch(() => null);
  if (!bus) throw bad('Invalid bus', 404);
  const taken = await takenSeats(bus._id, req.query.date);
  const seats = buildSeats(bus).map((s) => ({ ...s, state: s.maintenance ? 'maintenance' : taken.has(s.id) ? 'occupied' : s.accessible ? 'accessible' : 'available' }));
  res.json({ bus, seats });
}));
r.put('/seats/:id', auth, role('operator', 'admin'), h(async (req, res) => { // toggle maintenance
  const bus = await Bus.findById(req.body.busId);
  if (!bus) throw bad('Invalid bus', 404);
  const set = new Set(bus.maintenanceSeats);
  req.body.maintenance ? set.add(req.params.id) : set.delete(req.params.id);
  bus.maintenanceSeats = [...set];
  await bus.save();
  res.json(bus);
}));

// ---- Smart allocation ----
const recommend = h(async (req, res) => {
  const { busId, date, passengers } = req.body;
  checkPassengers(passengers, date);
  const bus = await Bus.findById(busId).catch(() => null);
  if (!bus) throw bad('Invalid bus', 404);
  res.json(allocate(passengers, bus, await takenSeats(bus._id, date)));
});
r.post('/allocation/recommend', recommend); // public so the demo works without login
r.post('/allocation/allocate', auth, recommend);

// ---- Bookings ----
r.post('/bookings', auth, h(async (req, res) => {
  const { busId, date, passengers, mode, confirmWarnings } = req.body;
  checkPassengers(passengers, date);
  const bus = await Bus.findById(busId).catch(() => null);
  if (!bus) throw bad('Invalid bus', 404);
  const { booking, result } = await createBooking({ user: req.user, bus, date, passengers, mode, confirmWarnings });
  res.status(201).json({ booking, result });
}));
r.get('/bookings', auth, h(async (req, res) => {
  const q = req.user.role === 'passenger' ? { user: req.user._id } : {};
  res.json(await Booking.find(q).populate('bus').sort('-createdAt').limit(200));
}));
const own = async (req) => {
  const b = await Booking.findOne({ bookingId: req.params.id }).populate('bus');
  if (!b || (req.user.role === 'passenger' && !b.user.equals(req.user._id))) throw bad('Booking not found', 404);
  return b;
};
r.get('/bookings/:id', auth, h(async (req, res) => res.json(await own(req))));
r.delete('/bookings/:id', auth, h(async (req, res) => {
  const b = await own(req);
  b.status = 'cancelled';
  await b.save();
  await SeatLock.deleteMany({ booking: b._id });
  await Notification.create({ user: b.user, type: 'booking_cancelled', message: `Booking ${b.bookingId} cancelled` });
  res.json({ message: 'Booking cancelled' });
}));
r.get('/notifications', auth, h(async (req, res) => res.json(await Notification.find({ user: req.user._id }).sort('-createdAt').limit(30))));

// ---- Analytics ----
const dashboard = h(async (req, res) => {
  const buses = await Bus.find();
  const totalSeats = buses.reduce((a, b) => a + b.rows * b.cols.length, 0);
  const upcoming = await SeatLock.find({ date: { $gte: today() } });
  const days = Math.max(1, new Set(upcoming.map((l) => l.date)).size);
  const occupied = upcoming.length, capacity = totalSeats * days;
  const confirmed = await Booking.find({ status: 'confirmed' });
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const count = (arr, key) => Object.entries(arr.reduce((m, x) => ((m[key(x)] = (m[key(x)] || 0) + 1), m), {}));
  const all = confirmed.flatMap((b) => b.passengers);
  const seatCounts = count(all, (p) => p.seat).map(([seat, c]) => ({ seat, count: c })).sort((a, b) => b.count - a.count);
  res.json({
    totals: {
      buses: buses.length, totalSeats, occupied, available: capacity - occupied,
      todayBookings: confirmed.filter((b) => b.createdAt >= start).length,
      revenue: confirmed.reduce((a, b) => a + b.totalAmount, 0),
      occupancyRate: +((occupied / capacity) * 100).toFixed(1),
      priorityPercent: all.length ? +((all.filter((p) => priorityOf(p) > 2).length / all.length) * 100).toFixed(1) : 0,
    },
    daily: count(confirmed, (b) => b.date).map(([date, c]) => ({ date, bookings: c })).sort((a, b) => a.date.localeCompare(b.date)),
    categories: count(all, (p) => p.passengerType).map(([name, value]) => ({ name, value })),
    popularSeats: seatCounts.slice(0, 8), leastUsedSeats: seatCounts.slice(-5).reverse(),
    busOccupancy: buses.map((b) => ({ bus: b.busName, rate: +((upcoming.filter((l) => l.bus.equals(b._id)).length / (b.rows * b.cols.length * days)) * 100).toFixed(1) })),
  });
});
r.get('/analytics/dashboard', auth, role('admin', 'operator'), dashboard);
r.get('/analytics/occupancy', auth, role('admin', 'operator'), dashboard);
r.get('/analytics/seats', auth, role('admin', 'operator'), h(async (req, res) => {
  const rows = await SeatLock.aggregate([{ $group: { _id: '$seat', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
  res.json(rows.map((x) => ({ seat: x._id, count: x.count })));
}));

export default r;
