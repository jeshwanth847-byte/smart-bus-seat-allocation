// Smart Rule-Based Allocation: transparent scoring, no machine learning.
export const PRIORITY = { disability: 7, wheelchair: 6, pregnant: 5, senior: 4, child: 3, student: 2, normal: 1 };

export const priorityOf = (p) => {
  if (p.passengerType === 'disability') return 7;
  if (['wheelchair', 'reduced'].includes(p.accessibility)) return 6;
  return PRIORITY[p.passengerType] || 1;
};
const needsAccess = (p) => ['wheelchair', 'reduced'].includes(p.accessibility) || p.passengerType === 'disability';

export function buildSeats(bus) {
  const front = Math.ceil(bus.rows / 3);
  const seats = [];
  for (let r = 1; r <= bus.rows; r++) {
    bus.cols.forEach((c, i) => {
      const window = i === 0 || i === bus.cols.length - 1;
      seats.push({
        id: `${r}${c}`, row: r, col: c, window, aisle: !window,
        front: r <= front, back: r > bus.rows - front,
        accessible: (bus.accessibleSeats || []).includes(`${r}${c}`),
        maintenance: (bus.maintenanceSeats || []).includes(`${r}${c}`),
      });
    });
  }
  return seats;
}

// Score one seat for one passenger. Returns { score (0-100), reasons[], warnings[] }
export function scoreSeat(p, s, groupSeats = []) {
  let score = 20; // base compatibility for any free seat
  const reasons = [], warnings = [];
  const add = (pts, text) => { score += pts; reasons.push(text); };

  if (needsAccess(p)) {
    if (s.accessible) add(30, 'Accessibility requirement matched (accessible seat)');
    else { score -= 15; warnings.push('This seat is not accessible but the passenger needs an accessible seat'); }
    if (s.front) add(10, 'Front/lower area, easy to board');
  } else if (s.accessible) {
    score -= 10; // keep accessible seats free for those who need them
  } else add(5, 'Away from accessible/reserved area');

  if (['senior', 'pregnant'].includes(p.passengerType)) {
    if (s.front) add(10, 'Front section suits priority passenger');
    if (s.aisle) add(10, 'Aisle seat is easier to reach');
    if (!needsAccess(p) && s.accessible) warnings.push('Accessible seats should stay free for passengers who need them');
  }

  const pref = p.seatPreference;
  if (pref === 'window' && s.window) add(15, 'Window preference matched');
  if (pref === 'aisle' && s.aisle) add(10, 'Aisle preference matched');
  if (pref === 'front' && s.front) add(10, 'Front-seat preference matched');
  if (pref === 'back' && s.back) add(10, 'Back-seat preference matched');

  if (groupSeats.length) {
    const same = groupSeats.filter((g) => parseInt(g) === s.row);
    if (same.length) {
      add(10, 'Seated in the same row as the group');
      if (same.some((g) => Math.abs(g.slice(-1).charCodeAt(0) - s.col.charCodeAt(0)) === 1)) add(5, 'Adjacent to a group member');
    } else if (groupSeats.some((g) => Math.abs(parseInt(g) - s.row) === 1)) add(5, 'Near the group (neighbouring row)');
  }
  return { score: Math.max(0, Math.min(100, score)), reasons, warnings };
}

// allocate(passengers, bus, takenSet) -> one result per passenger (same order as input)
export function allocate(passengers, bus, taken = new Set()) {
  const used = new Set(taken);
  const order = passengers.map((p, i) => ({ p, i })).sort((a, b) => priorityOf(b.p) - priorityOf(a.p));
  const groupSeats = [], out = [];
  order.forEach(({ p, i }, step) => {
    const cands = buildSeats(bus)
      .filter((s) => !s.maintenance && !used.has(s.id))             // 1. filter unavailable
      .map((s) => ({ seat: s.id, ...scoreSeat(p, s, groupSeats) })) // 2-6. constraints, prefs, group, score
      .sort((a, b) => b.score - a.score);                           // 7. rank
    if (!cands.length) throw Object.assign(new Error('No seats available on this bus for this date'), { status: 409 });
    const best = cands[0];                                          // 8. pick best
    used.add(best.seat); groupSeats.push(best.seat);
    out[i] = { passenger: p, order: step + 1, priority: priorityOf(p), seat: best.seat, score: best.score, reasons: best.reasons, warnings: best.warnings, alternatives: cands.slice(1, 3), candidates: cands.slice(0, 5) };
  });
  return out;
}

export function checkManual(p, seatId, bus) {
  const s = buildSeats(bus).find((x) => x.id === seatId);
  if (!s || s.maintenance) return null;
  return { seat: seatId, ...scoreSeat(p, s) };
}
