import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api.js';

export default function MyBookings() {
  const [list, setList] = useState(null); const [err, setErr] = useState('');
  const load = () => api.get('/bookings').then((r) => setList(r.data)).catch((e) => setErr(e.friendly));
  useEffect(() => { load(); }, []);
  const cancel = async (id) => { if (window.confirm('Cancel this booking?')) { try { await api.delete('/bookings/' + id); load(); } catch (e) { setErr(e.friendly); } } };
  if (err) return <p className="rounded bg-red-50 p-3 text-red-600">{err}</p>;
  if (!list) return <p className="p-10 text-center">Loading...</p>;
  if (!list.length) return <p className="rounded-xl bg-white p-10 text-center">No bookings yet. Search for a bus to get started.</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {list.map((b) => (
        <div key={b._id} className={`flex justify-between gap-3 rounded-2xl border-l-8 bg-white p-4 shadow ${b.status === 'cancelled' ? 'border-red-400 opacity-60' : 'border-indigo-600'}`}>
          <div className="text-sm">
            <p className="font-mono font-bold">{b.bookingId} <span className="text-xs">({b.status})</span></p>
            <p>{b.bus?.busName} · {b.bus?.busNumber}</p>
            <p>{b.bus?.source} → {b.bus?.destination}</p>
            <p>{b.date} · departs {b.bus?.departureTime}</p>
            {b.passengers.map((p) => <p key={p.seat}>{p.name}: <b>Seat {p.seat}</b></p>)}
            <p>₹{b.totalAmount} · {b.allocationMode} (score {b.allocationScore})</p>
            {b.status === 'confirmed' && <button onClick={() => cancel(b.bookingId)} className="mt-2 text-red-600 underline">Cancel</button>}
          </div>
          <QRCodeSVG size={90} value={`${b.bookingId}|${b.bus?.busNumber}|${b.date}|${b.seatNumbers.join(',')}`} />
        </div>
      ))}
    </div>
  );
}
