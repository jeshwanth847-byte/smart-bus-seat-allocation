# SmartBus – Intelligent Bus Seat Allocation System

Smart Rule-Based Allocation: every free seat is scored per passenger with transparent rules (no ML claims).
Code: `server/services/allocation.js`.

## Setup (needs Node 18+ and MongoDB running locally)
```
cd server && cp .env.example .env && npm install && npm run seed && npm run dev   # API on :5000
cd client && npm install && npm run dev                                           # UI on :5173
```
Seed logins (password `Password@123`): `admin@smartbus.com`, `operator@smartbus.com`, `passenger1@example.com`

## Test
1. Open http://localhost:5173/demo and click **Run Smart Allocation Demo**.
2. Log in as a passenger, search Hyderabad → Vijayawada, book with Smart and Manual mode.
3. Manual-select a non-accessible seat for a wheelchair passenger: a warning appears.
4. Try booking the same seat from two sessions: the unique `SeatLock` index blocks the second.
5. Log in as admin for analytics.

## Design notes
- Seat availability = `SeatLock` documents (unique bus+date+seat) – prevents double booking. Seat layout is generated from the bus (`rows`, `cols`, `accessibleSeats`, `maintenanceSeats`).
- Priority order: disability > wheelchair/reduced mobility > pregnant > senior > child > student > normal.
- Not yet built: operator bus-management UI (API exists: `/api/buses`, `PUT /api/seats/:id`), separate routes/passengers collections, trip-reminder notifications.
