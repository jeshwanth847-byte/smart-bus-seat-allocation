import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Bus, Booking, SeatLock, Notification } from '../models/index.js';
import { createBooking } from '../services/bookingService.js';

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
await mongoose.connect(process.env.MONGO_URI);
await Promise.all([User, Bus, Booking, SeatLock, Notification].map((m) => m.deleteMany({})));
const password = await bcrypt.hash('Password@123', 10);

await User.create([
  { name: 'Admin', email: 'admin@smartbus.com', password, role: 'admin' },
  { name: 'Operator', email: 'operator@smartbus.com', password, role: 'operator' },
]);
const first = ['Ravi', 'Anita', 'Suresh', 'Lakshmi', 'Kiran', 'Priya', 'Venkat', 'Sneha', 'Arjun', 'Divya', 'Manoj'];
const last = ['Reddy', 'Sharma', 'Rao', 'Naidu', 'Kumar', 'Patel', 'Goud', 'Varma'];
const types = ['normal', 'normal', 'normal', 'student', 'senior', 'child', 'pregnant', 'disability'];
const prefs = ['window', 'aisle', 'front', 'back', 'any'];
const list = [];
for (let i = 1; i <= 55; i++) {
  const t = pick(types);
  list.push({
    name: `${pick(first)} ${pick(last)}`, email: `passenger${i}@example.com`, password, phone: `98480${10000 + i}`,
    age: t === 'senior' ? 62 + (i % 15) : t === 'child' ? 6 + (i % 8) : 19 + (i % 30), gender: i % 2 ? 'male' : 'female',
    passengerType: t, accessibilityRequirement: t === 'disability' ? pick(['wheelchair', 'reduced']) : 'none', seatPreference: pick(prefs),
  });
}
const users = await User.create(list);

const base = { rows: 10, cols: ['A', 'B', 'C', 'D'], accessibleSeats: ['1A', '1B', '2A', '2B'], maintenanceSeats: ['10D'] };
const buses = await Bus.create([
  { ...base, busNumber: 'TS09 AB 1001', busName: 'Charminar Express', busType: 'AC Seater', source: 'Hyderabad', destination: 'Vijayawada', departureTime: '06:00', arrivalTime: '11:00', duration: '5h', price: 550, amenities: ['WiFi', 'Charging', 'Water'] },
  { ...base, busNumber: 'TS09 CD 2002', busName: 'Deccan Travels', busType: 'Non-AC Sleeper', source: 'Hyderabad', destination: 'Warangal', departureTime: '07:30', arrivalTime: '10:30', duration: '3h', price: 250, amenities: ['Charging'] },
  { ...base, busNumber: 'TS09 EF 3003', busName: 'Nizam Voyager', busType: 'AC Sleeper', source: 'Hyderabad', destination: 'Bengaluru', departureTime: '21:00', arrivalTime: '06:00', duration: '9h', price: 1100, amenities: ['WiFi', 'Blanket', 'Charging', 'Water'] },
  { ...base, busNumber: 'TS09 GH 4004', busName: 'Venkateswara Link', busType: 'Electric Bus', source: 'Hyderabad', destination: 'Tirupati', departureTime: '20:00', arrivalTime: '05:30', duration: '9h 30m', price: 900, amenities: ['Charging', 'Eco-friendly'] },
  { ...base, busNumber: 'TS09 IJ 5005', busName: 'Vizag Rider', busType: 'AC Seater', source: 'Hyderabad', destination: 'Visakhapatnam', departureTime: '19:00', arrivalTime: '07:00', duration: '12h', price: 1300, amenities: ['WiFi', 'Charging', 'Water'] },
  { ...base, busNumber: 'TS09 KL 6006', busName: 'Bay of Bengal Star', busType: 'AC Sleeper', source: 'Hyderabad', destination: 'Chennai', departureTime: '22:15', arrivalTime: '08:15', duration: '10h', price: 1250, amenities: ['WiFi', 'Blanket', 'Charging'] },
  { ...base, busNumber: 'TS09 MN 7007', busName: 'Cochin Horizon', busType: 'Sleeper', source: 'Hyderabad', destination: 'Kochi', departureTime: '20:30', arrivalTime: '09:30', duration: '13h', price: 1450, amenities: ['WiFi', 'Charging', 'Water', 'Blanket'] },
  { ...base, busNumber: 'TS09 OP 8008', busName: 'Nilgiri Ride', busType: 'AC Seater', source: 'Hyderabad', destination: 'Coimbatore', departureTime: '18:45', arrivalTime: '06:45', duration: '12h', price: 1100, amenities: ['WiFi', 'Charging', 'Water'] },
  { ...base, busNumber: 'TS09 QR 9009', busName: 'Golden Coast Express', busType: 'AC Sleeper', source: 'Hyderabad', destination: 'Goa', departureTime: '18:00', arrivalTime: '07:00', duration: '13h', price: 1500, amenities: ['WiFi', 'Blanket', 'Charging', 'Water'] },
]);

const asP = (x) => ({ name: x.name, age: x.age, passengerType: x.passengerType, accessibility: x.accessibilityRequirement, seatPreference: x.seatPreference });
let made = 0;
for (let i = 0; i < 80; i++) {
  const u = pick(users), group = [asP(u)];
  if (Math.random() < 0.4) for (let k = 0; k < 1 + Math.floor(Math.random() * 2); k++) group.push(asP(pick(users)));
  try { await createBooking({ user: u, bus: pick(buses), date: day(1 + (i % 3)), passengers: group, mode: 'smart' }); made++; } catch (e) { /* duplicate or full: skip */ }
}
console.log(`Seeded 5 buses, ${users.length} passengers, ${made} bookings.`);
console.log('Logins (password Password@123): admin@smartbus.com, operator@smartbus.com, passenger1@example.com');
process.exit(0);
