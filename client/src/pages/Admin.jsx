import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Bus as BusIcon, Users, Calendar, ShieldCheck, ArrowRight, Eye, Sparkles } from 'lucide-react';
import api from '../services/api.js';

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const Card = ({ t, v, sub, color = 'text-indigo-600' }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md">
    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t}</p>
    <p className={`mt-1 text-2xl font-black ${color}`}>{v}</p>
    {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
  </div>
);

const Chart = ({ title, children }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-700">{title}</h3>
    <div className="h-60">
      <ResponsiveContainer>{children}</ResponsiveContainer>
    </div>
  </div>
);

export default function Admin() {
  const [d, setD] = useState(null);
  const [buses, setBuses] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dashboard'),
      api.get('/buses')
    ])
      .then(([dashRes, busRes]) => {
        setD(dashRes.data);
        setBuses(busRes.data || []);
      })
      .catch((e) => setErr(e.friendly || 'Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (err) return <p className="rounded-xl bg-red-50 p-4 text-red-600">{err}</p>;
  if (loading || !d) return <p className="p-12 text-center text-slate-500">Loading dashboard analytics and fleet...</p>;

  const t = d.totals;
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Operator & Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time fleet monitoring, smart seat utilization, and passenger demographics.
          </p>
        </div>
        <button
          onClick={() => nav('/demo')}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
        >
          <Sparkles className="h-4 w-4" /> Run Smart Allocation Demo
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card t="Active Buses" v={t.buses} sub="Demo fleet operational" color="text-indigo-600" />
        <Card t="Total Capacity" v={t.totalSeats} sub="Across all active coaches" color="text-slate-800" />
        <Card t="Occupied Seats" v={t.occupied} sub="Confirmed upcoming bookings" color="text-sky-600" />
        <Card t="Available Seats" v={t.available} sub="Ready for smart allocation" color="text-emerald-600" />
        <Card t="Today's Bookings" v={t.todayBookings} sub="New reservations created" color="text-indigo-600" />
        <Card t="Total Revenue" v={'₹' + t.revenue.toLocaleString()} sub="Gross booking value" color="text-amber-600" />
        <Card t="Occupancy Rate" v={t.occupancyRate + '%'} sub="Average seat filling ratio" color="text-violet-600" />
        <Card t="Priority Passengers" v={t.priorityPercent + '%'} sub="Disability, Senior, Child, etc." color="text-rose-600" />
      </div>

      {/* Demo Buses Section */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BusIcon className="h-5 w-5 text-indigo-600" /> Available Demo Fleet & Routes
            </h2>
            <p className="text-xs text-slate-500">
              Live operational demo buses configured for smart rule-based allocation testing.
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            {buses.length} Demo Buses Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Bus & Details</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Type & Amenities</th>
                <th className="px-4 py-3">Seat Availability</th>
                <th className="px-4 py-3">Fare</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {buses.map((b) => (
                <tr key={b._id} className="hover:bg-slate-50/70 transition">
                  <td className="px-4 py-3.5 font-medium text-slate-900">
                    <div className="font-bold text-slate-800">{b.busName}</div>
                    <div className="text-xs text-slate-400 font-mono">{b.busNumber}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                      {b.source} <ArrowRight className="h-3 w-3 text-slate-400" /> {b.destination}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-xs font-medium text-slate-700">{b.departureTime} → {b.arrivalTime}</div>
                    <div className="text-[11px] text-slate-400">{b.duration} journey</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-block rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 mb-1">
                      {b.busType}
                    </span>
                    <div className="text-[11px] text-slate-400">
                      {b.amenities?.slice(0, 3).join(', ')}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{b.availableSeats ?? b.totalSeats}</span>
                      <span className="text-xs text-slate-400">/ {b.totalSeats} seats</span>
                    </div>
                    {b.accessibleSeats?.length > 0 && (
                      <div className="text-[11px] text-emerald-600 font-medium">
                        ♿ {b.accessibleSeats.length} accessible seats ({b.accessibleSeats.join(', ')})
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-800">
                    ₹{b.price}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => nav(`/book/${b._id}?date=${tomorrow}&n=1`)}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-600 hover:text-white transition"
                    >
                      <Eye className="h-3.5 w-3.5" /> Book / Test
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Chart title="Bookings by Travel Date">
          <BarChart data={d.daily}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
            <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
            <Tooltip />
            <Bar dataKey="bookings" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </Chart>

        <Chart title="Bus Occupancy Rate (%)">
          <BarChart data={d.busOccupancy}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="bus" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} unit="%" />
            <Tooltip />
            <Bar dataKey="rate" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
          </BarChart>
        </Chart>

        <Chart title="Passenger Demographic Distribution">
          <PieChart>
            <Pie data={d.categories} dataKey="value" nameKey="name" label={(entry) => `${entry.name} (${entry.value})`} outerRadius={80}>
              {d.categories.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </Chart>

        <Chart title="Most Popular Allocated Seats">
          <BarChart data={d.popularSeats}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="seat" stroke="#94a3b8" fontSize={12} />
            <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
            <Tooltip />
            <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </Chart>
      </div>

      <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
        <span className="font-semibold text-slate-700">Least allocated seats in fleet: </span>
        {d.leastUsedSeats?.length > 0 ? d.leastUsedSeats.map((s) => `${s.seat} (${s.count} times)`).join(', ') : 'None yet'}
      </div>
    </div>
  );
}
