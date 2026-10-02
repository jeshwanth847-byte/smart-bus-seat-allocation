import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const ref = (n) => ({ type: Schema.Types.ObjectId, ref: n });

export const User = model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: String,
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['passenger', 'operator', 'admin'], default: 'passenger' },
  age: { type: Number, min: 0, max: 120 },
  gender: String,
  passengerType: { type: String, enum: ['normal', 'senior', 'child', 'pregnant', 'disability', 'student'], default: 'normal' },
  accessibilityRequirement: { type: String, enum: ['none', 'wheelchair', 'reduced', 'visual', 'other'], default: 'none' },
  seatPreference: { type: String, enum: ['window', 'aisle', 'front', 'back', 'any'], default: 'any' },
}, { timestamps: true }));

export const Bus = model('Bus', new Schema({
  busNumber: { type: String, required: true, unique: true },
  busName: { type: String, required: true },
  busType: { type: String, enum: ['AC Sleeper', 'Non-AC Sleeper', 'AC Seater', 'Electric Bus', 'City Bus'], required: true },
  source: { type: String, required: true },
  destination: { type: String, required: true },
  departureTime: String, arrivalTime: String, duration: String,
  price: { type: Number, required: true, min: 0 },
  // configurable layout: rows x column letters (a gap is drawn in the middle)
  rows: { type: Number, default: 10, min: 1, max: 20 },
  cols: { type: [String], default: ['A', 'B', 'C', 'D'] },
  accessibleSeats: [String],
  maintenanceSeats: [String],
  amenities: [String],
  operator: ref('User'),
}, { timestamps: true }));

export const Booking = model('Booking', new Schema({
  bookingId: { type: String, unique: true },
  user: ref('User'), bus: ref('Bus'),
  date: { type: String, required: true },
  passengers: [{ name: String, age: Number, passengerType: String, accessibility: String, seatPreference: String, seat: String, score: Number, reasons: [String] }],
  seatNumbers: [String],
  totalAmount: Number,
  allocationMode: { type: String, enum: ['smart', 'manual'] },
  allocationScore: Number,
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
}, { timestamps: true }));

// One lock per (bus, date, seat). The unique index makes double booking impossible.
const lock = new Schema({ bus: ref('Bus'), date: String, seat: String, booking: ref('Booking') });
lock.index({ bus: 1, date: 1, seat: 1 }, { unique: true });
export const SeatLock = model('SeatLock', lock);

export const Notification = model('Notification', new Schema({
  user: ref('User'), type: String, message: String, read: { type: Boolean, default: false },
}, { timestamps: true }));
