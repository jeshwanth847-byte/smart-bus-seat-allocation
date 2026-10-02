import { useEffect, useState } from 'react';
import api from '../services/api.js';
import SeatMap from '../components/SeatMap.jsx';
import AllocationResult, { Pipeline } from '../components/AllocationResult.jsx';

const DEMO = [
  { name: 'Passenger 1 (Senior)', age: 68, passengerType: 'senior', accessibility: 'none', seatPreference: 'aisle' },
  { name: 'Passenger 2 (Normal)', age: 30, passengerType: 'normal', accessibility: 'none', seatPreference: 'window' },
  { name: 'Passenger 3 (Disability)', age: 40, passengerType: 'disability', accessibility: 'reduced', seatPreference: 'any' },
  { name: 'Passenger 4 (Student)', age: 20, passengerType: 'student', accessibility: 'none', seatPreference: 'window' },
];
const tomorrow = () => new Date(Date.now() + 864e5).toISOString().slice(0, 10);

export default function Demo() {
  const [bus, setBus] = useState(null); const [seats, setSeats] = useState([]);
  const [plan, setPlan] = useState([]); const [shown, setShown] = useState(0); const [err, setErr] = useState('');
  useEffect(() => {
    api.get('/buses').then(async (r) => {
      if (!r.data.length) return setErr('No buses found. Run: npm run seed (in /server)');
      setBus(r.data[0]);
      setSeats((await api.get(`/buses/${r.data[0]._id}/seats`, { params: { date: tomorrow() } })).data.seats);
    }).catch((e) => setErr(e.friendly));
  }, []);
  const run = async () => {
    setErr(''); setShown(0);
    try {
      const { data } = await api.post('/allocation/recommend', { busId: bus._id, date: tomorrow(), passengers: DEMO });
      const ordered = [...data].sort((a, b) => a.order - b.order);
      setPlan(ordered);
      ordered.forEach((_, i) => setTimeout(() => setShown(i + 1), (i + 1) * 1200)); // step-by-step reveal
    } catch (e) { setErr(e.friendly); }
  };
  const visible = plan.slice(0, shown);
  return (
    <div>
      <h2 className="text-2xl font-bold">Smart Allocation Demo</h2>
      <p className="mb-3 text-sm text-slate-600">Four passengers are allocated in priority order on {bus?.busName || '...'} (no booking is saved).</p>
      <Pipeline />
      {err && <p className="mb-3 rounded bg-red-50 p-2 text-red-600">{err}</p>}
      <button onClick={run} disabled={!bus} className="mb-4 rounded-lg bg-indigo-600 px-5 py-2 text-white disabled:opacity-50">Run Smart Allocation Demo</button>
      <div className="grid gap-6 lg:grid-cols-2">
        <SeatMap seats={seats} highlight={visible.map((a) => a.seat)} />
        <div>{visible.map((a) => <AllocationResult key={a.seat} a={a} />)}</div>
      </div>
    </div>
  );
}
