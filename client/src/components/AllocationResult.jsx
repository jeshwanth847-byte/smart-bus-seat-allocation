import { CheckCircle2 } from 'lucide-react';
const STEPS = ['Passenger requirements', 'Available seats', 'Compatibility scoring', 'Priority rules', 'Group seating analysis', 'Best seat selection', 'Seat confirmation'];

export function Pipeline() {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
      {STEPS.map((s, i) => <span key={s} className="flex items-center gap-2"><span className="rounded-full bg-indigo-100 px-3 py-1 font-medium text-indigo-700">{i + 1}. {s}</span>{i < STEPS.length - 1 && '→'}</span>)}
    </div>
  );
}

export default function AllocationResult({ a }) {
  return (
    <div className="mb-4 rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{a.passenger.name} <span className="text-xs font-normal text-slate-500">({a.passenger.passengerType}, priority {a.priority}, processed #{a.order})</span></h3>
        <span className="rounded-full bg-amber-300 px-3 py-1 text-sm font-bold">Recommended: {a.seat} · {a.score}/100</span>
      </div>
      <p className="mt-2 text-sm font-medium">Seat {a.seat} was allocated because:</p>
      <ul className="text-sm text-slate-700">
        {a.reasons.map((r) => <li key={r} className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-600" />{r}</li>)}
        <li className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-600" />Highest available compatibility score: {a.score}</li>
      </ul>
      <table className="mt-3 w-full text-left text-sm">
        <thead className="text-xs text-slate-500"><tr><th>Seat</th><th>Score</th><th>Status</th></tr></thead>
        <tbody>{a.candidates.map((c, i) => (
          <tr key={c.seat} className={i === 0 ? 'bg-amber-50 font-semibold' : ''}><td>{c.seat}</td><td>{c.score}</td><td>{i === 0 ? 'Recommended' : i < 3 ? 'Alternative' : 'Available'}</td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}
