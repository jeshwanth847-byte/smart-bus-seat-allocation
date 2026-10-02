const COLORS = {
  available: 'bg-emerald-100 border-emerald-400 text-emerald-800 hover:bg-emerald-200',
  accessible: 'bg-sky-100 border-sky-500 text-sky-800 hover:bg-sky-200',
  occupied: 'bg-slate-300 border-slate-400 text-slate-500 cursor-not-allowed',
  maintenance: 'bg-red-100 border-red-400 text-red-500 cursor-not-allowed line-through',
  selected: 'bg-indigo-600 border-indigo-700 text-white',
  recommended: 'bg-amber-300 border-amber-500 text-amber-900 ring-2 ring-amber-400 animate-pulse',
};
export const LEGEND = [['available', 'Available'], ['accessible', 'Accessible'], ['occupied', 'Occupied'], ['maintenance', 'Maintenance'], ['selected', 'Selected'], ['recommended', 'Recommended']];

// seats: [{id,row,col,state}], selected: [ids], highlight: [ids], onSelect(id)
export default function SeatMap({ seats, selected = [], highlight = [], onSelect }) {
  const rows = [...new Set(seats.map((s) => s.row))];
  return (
    <div className="mx-auto w-fit rounded-3xl border-2 border-slate-300 bg-white p-4 shadow">
      <div className="mb-3 rounded-lg bg-slate-200 py-1 text-center text-xs font-semibold tracking-widest">FRONT · DRIVER</div>
      {rows.map((r) => {
        const rs = seats.filter((s) => s.row === r), half = rs.length / 2;
        return (
          <div key={r} className="mb-2 flex items-center gap-1">
            {rs.map((s, i) => {
              const key = selected.includes(s.id) ? 'selected' : highlight.includes(s.id) ? 'recommended' : s.state;
              const disabled = ['occupied', 'maintenance'].includes(s.state);
              return (
                <div key={s.id} className={i === half ? 'ml-8 flex' : 'flex'}>
                  <button disabled={disabled || !onSelect} onClick={() => onSelect?.(s.id)} title={`${s.id} (${key})`}
                    className={`h-10 w-10 rounded-lg border text-xs font-bold transition ${COLORS[key]}`}>{s.id}</button>
                </div>
              );
            })}
          </div>
        );
      })}
      <div className="mt-3 rounded-lg bg-slate-200 py-1 text-center text-xs font-semibold tracking-widest">BACK</div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {LEGEND.map(([k, l]) => <span key={k} className="flex items-center gap-1"><i className={`inline-block h-3 w-3 rounded border ${COLORS[k].split(' ').slice(0, 2).join(' ')}`} />{l}</span>)}
      </div>
    </div>
  );
}
