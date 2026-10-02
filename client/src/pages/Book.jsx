import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import SeatMap from '../components/SeatMap.jsx';
import AllocationResult, { Pipeline } from '../components/AllocationResult.jsx';
import { ACCESS, PREFS, TYPES, inp, sel } from './Auth.jsx';

const blank = () => ({ name: '', age: '', passengerType: 'normal', accessibility: 'none', seatPreference: 'any', seat: '' });

export default function Book() {
  const { id } = useParams(); const [q] = useSearchParams(); const nav = useNavigate(); const { user } = useAuth();
  const date = q.get('date'); const n = Math.min(6, +q.get('n') || 1);
  const [bus, setBus] = useState(null); const [seats, setSeats] = useState([]);
  const [ps, setPs] = useState(() => Array.from({ length: n }, (_, i) => i === 0 && user ? { ...blank(), name: user.name, age: user.age || '', passengerType: user.passengerType, accessibility: user.accessibilityRequirement, seatPreference: user.seatPreference } : blank()));
  const [mode, setMode] = useState('smart'); const [plan, setPlan] = useState(null); const [active, setActive] = useState(0);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);

  useEffect(() => { api.get(`/buses/${id}/seats`, { params: { date } }).then((r) => { setBus(r.data.bus); setSeats(r.data.seats); }).catch((e) => setErr(e.friendly)); }, [id, date]);
  const set = (i, k, v) => setPs((p) => p.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  const recommend = async () => {
    setErr(''); setBusy(true);
    try { setPlan((await api.post('/allocation/recommend', { busId: id, date, passengers: ps })).data); } catch (e) { setErr(e.friendly); setPlan(null); } finally { setBusy(false); }
  };
  const confirm = async (confirmWarnings = false) => {
    setErr(''); setBusy(true);
    try {
      await api.post('/bookings', { busId: id, date, passengers: ps, mode, confirmWarnings });
      nav('/bookings');
    } catch (e) {
      const w = e.response?.data?.warnings;
      if (w?.length && window.confirm('Warning:\n' + w.join('\n') + '\n\nBook these seats anyway?')) return confirm(true);
      setErr(e.friendly);
    } finally { setBusy(false); }
  };
  const pick = (seatId) => { set(active, 'seat', seatId); setActive((active + 1) % ps.length); };

  if (!bus) return <p className="p-10 text-center">{err || 'Loading bus...'}</p>;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="text-xl font-bold">{bus.busName}: {bus.source} → {bus.destination}</h2>
        <p className="mb-3 text-sm text-slate-500">{date} · ₹{bus.price} per seat</p>
        {err && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{err}</p>}
        <div className="mb-3 flex gap-2">
          {['smart', 'manual'].map((m) => <button key={m} onClick={() => { setMode(m); setPlan(null); }} className={`rounded-full px-4 py-1 text-sm ${mode === m ? 'bg-indigo-600 text-white' : 'bg-white'}`}>{m === 'smart' ? 'Smart Allocation' : 'Manual Selection'}</button>)}
        </div>
        {ps.map((p, i) => (
          <div key={i} onClick={() => setActive(i)} className={`mb-3 space-y-2 rounded-2xl bg-white p-3 shadow-sm ${mode === 'manual' && active === i ? 'ring-2 ring-indigo-500' : ''}`}>
            <p className="text-sm font-semibold">Passenger {i + 1} {mode === 'manual' && <span className="text-indigo-600">· seat: {p.seat || 'click a seat'}</span>}</p>
            <div className="grid grid-cols-2 gap-2">
              <input className={inp} placeholder="Name" value={p.name} onChange={(e) => set(i, 'name', e.target.value)} />
              <input className={inp} type="number" placeholder="Age" value={p.age} onChange={(e) => set(i, 'age', e.target.value)} />
              <select className={inp} value={p.passengerType} onChange={(e) => set(i, 'passengerType', e.target.value)}>{sel(TYPES)}</select>
              <select className={inp} value={p.accessibility} onChange={(e) => set(i, 'accessibility', e.target.value)}>{sel(ACCESS)}</select>
              <select className={inp} value={p.seatPreference} onChange={(e) => set(i, 'seatPreference', e.target.value)}>{sel(PREFS)}</select>
            </div>
          </div>
        ))}
        {mode === 'smart'
          ? <button onClick={recommend} disabled={busy} className="rounded-lg bg-indigo-600 px-5 py-2 text-white disabled:opacity-50">{busy ? 'Scoring seats...' : 'Find best seats'}</button>
          : null}
        <button onClick={() => confirm()} disabled={busy || (mode === 'smart' && !plan) || (mode === 'manual' && ps.some((p) => !p.seat))} className="ml-2 rounded-lg bg-emerald-600 px-5 py-2 text-white disabled:opacity-40">Confirm booking · ₹{bus.price * ps.length}</button>
      </div>
      <div>
        <SeatMap seats={seats} selected={mode === 'manual' ? ps.map((p) => p.seat).filter(Boolean) : []} highlight={plan?.map((a) => a.seat) || []} onSelect={mode === 'manual' ? pick : undefined} />
        {plan && <div className="mt-4"><Pipeline />{plan.map((a, i) => <AllocationResult key={i} a={a} />)}
          {plan.length > 1 && <p className="text-sm text-emerald-700">{plan.length} passengers were seated close together where possible.</p>}</div>}
      </div>
    </div>
  );
}
