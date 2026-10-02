import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bus, Search, ArrowRight, ShieldCheck, Sparkles, UserPlus, CheckCircle2, SlidersHorizontal, RefreshCw } from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { inp } from './Auth.jsx';

const tomorrow = () => new Date(Date.now() + 864e5).toISOString().slice(0, 10);

export default function Home() {
  const [q, setQ] = useState({ source: 'Hyderabad', destination: '', date: tomorrow(), passengers: 1 });
  const [buses, setBuses] = useState([]);
  const [allDemoBuses, setAllDemoBuses] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedRouteFilter, setSelectedRouteFilter] = useState('ALL');
  const { user } = useAuth();
  const nav = useNavigate();

  // Load all available demo buses on page mount
  const loadDemoBuses = async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await api.get('/buses', { params: { date: q.date } });
      setBuses(res.data || []);
      setAllDemoBuses(res.data || []);
    } catch (x) {
      setErr(x.friendly || 'Failed to load buses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDemoBuses();
  }, [q.date]);

  const search = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErr('');
    setSelectedRouteFilter('CUSTOM');
    try {
      const params = { ...q };
      if (!params.destination.trim()) delete params.destination;
      if (!params.source.trim()) delete params.source;
      const res = await api.get('/buses', { params });
      setBuses(res.data || []);
    } catch (x) {
      setErr(x.friendly || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRouteFilter = (dest) => {
    setSelectedRouteFilter(dest);
    if (dest === 'ALL') {
      setBuses(allDemoBuses);
      setQ((prev) => ({ ...prev, destination: '' }));
    } else {
      const filtered = allDemoBuses.filter(
        (b) => b.destination.toLowerCase() === dest.toLowerCase()
      );
      setBuses(filtered);
      setQ((prev) => ({ ...prev, destination: dest }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-sky-600 p-6 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm mb-3">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Transparent Rule-Based Allocation Engine
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl tracking-tight leading-tight">
            SmartBus: Intelligent Bus Seat Allocation
          </h1>
          <p className="mt-2 text-sm sm:text-base text-indigo-100 leading-relaxed">
            Eliminate chaotic booking. Every open seat is scored per passenger with transparent criteria — prioritizing wheelchair & reduced mobility, pregnant travelers, seniors, and families.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={search} className="relative z-10 mt-6 grid gap-2.5 rounded-2xl bg-white p-3 text-slate-800 shadow-lg sm:grid-cols-5">
          <div>
            <label className="mb-0.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">From</label>
            <input
              className={inp}
              placeholder="Source city"
              value={q.source}
              onChange={(e) => setQ({ ...q, source: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">To Destination</label>
            <input
              className={inp}
              placeholder="e.g. Vijayawada, Bengaluru"
              value={q.destination}
              onChange={(e) => setQ({ ...q, destination: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Travel Date</label>
            <input
              className={inp}
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={q.date}
              onChange={(e) => setQ({ ...q, date: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Passengers</label>
            <input
              className={inp}
              type="number"
              min="1"
              max="6"
              value={q.passengers}
              onChange={(e) => setQ({ ...q, passengers: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
            >
              <Search className="h-4 w-4" /> Find Seats
            </button>
          </div>
        </form>
      </section>

      {/* First Time User Registration Banner */}
      {!user && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-500 p-2.5 text-white shadow">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                First Time Using SmartBus? Register in 30 Seconds!
              </h2>
              <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">
                Create your passenger profile once to get automated priority seat matching for seniors, wheelchair/disability accessibility, and window/aisle preferences.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-700"
            >
              Register Now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Log In
            </Link>
          </div>
        </section>
      )}

      {/* Available Demo Buses Section */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Bus className="h-5 w-5 text-indigo-600" /> Available Demo Buses & Schedules
            </h2>
            <p className="text-xs text-slate-500">
              Select any bus below to test Smart Rule-Based Seat Allocation or manual seating.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSelectedRouteFilter('ALL'); loadDemoBuses(); }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
            >
              <RefreshCw className="h-3 w-3" /> Reset / Show All
            </button>
          </div>
        </div>

        {/* Route Quick Filter Chips */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => handleRouteFilter('ALL')}
            className={`rounded-full px-3.5 py-1.5 font-medium transition ${
              selectedRouteFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            All Buses ({allDemoBuses.length})
          </button>
          {['Vijayawada', 'Bengaluru', 'Warangal', 'Tirupati', 'Visakhapatnam'].map((dest) => (
            <button
              key={dest}
              onClick={() => handleRouteFilter(dest)}
              className={`rounded-full px-3.5 py-1.5 font-medium transition ${
                selectedRouteFilter === dest
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Hyderabad → {dest}
            </button>
          ))}
        </div>

        {/* Bus List */}
        {loading && <p className="py-10 text-center text-slate-500">Loading available demo buses...</p>}
        {err && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{err}</div>}

        {!loading && buses.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="font-semibold text-slate-800">No buses found for this search.</p>
            <p className="mt-1 text-xs text-slate-500">Try changing your search destination or click below to view all demo buses.</p>
            <button
              onClick={() => { setSelectedRouteFilter('ALL'); loadDemoBuses(); }}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
            >
              View All Demo Buses
            </button>
          </div>
        )}

        <div className="grid gap-3.5">
          {buses.map((b) => (
            <div
              key={b._id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-indigo-200"
            >
              <div className="space-y-1 sm:max-w-md">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{b.busName}</h3>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600">
                    {b.busNumber}
                  </span>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    {b.busType}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <span>{b.source}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  <span>{b.destination}</span>
                  <span className="text-xs font-normal text-slate-400">·</span>
                  <span className="text-xs font-medium text-slate-500">
                    {b.departureTime} – {b.arrivalTime} ({b.duration})
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
                  <span>Amenities: {b.amenities?.join(' · ')}</span>
                  {b.accessibleSeats?.length > 0 && (
                    <span className="font-medium text-emerald-600">
                      · ♿ {b.accessibleSeats.length} Accessible Seats ({b.accessibleSeats.join(', ')})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <p className="text-2xl font-black text-slate-900">₹{b.price}</p>
                  <p className="text-xs font-semibold text-emerald-600">
                    {b.availableSeats ?? b.totalSeats} seats available
                  </p>
                </div>
                <button
                  onClick={() => nav(`/book/${b._id}?date=${q.date}&n=${q.passengers}`)}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition"
                >
                  Book Seat
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Explanatory & Feature Section */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-bold text-slate-900">How Smart Allocation Works</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <h3 className="font-bold text-slate-800">1. Problem</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Standard booking sites allow arbitrary seat picking, leaving persons with disabilities or seniors stranded with inaccessible or back-row seats.
            </p>
          </div>
          <div className="rounded-xl bg-indigo-50/70 p-4 border border-indigo-100">
            <h3 className="font-bold text-indigo-900">2. Transparent Scoring</h3>
            <p className="mt-1 text-xs text-indigo-800 leading-relaxed">
              Every free seat is scored per passenger (+30 accessibility, +15 window, +10 aisle, +10 front, +10 group adjacency). No black-box claims.
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50/70 p-4 border border-emerald-100">
            <h3 className="font-bold text-emerald-900">3. Priority Order</h3>
            <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
              Disability &gt; Wheelchair/Reduced Mobility &gt; Pregnant &gt; Senior &gt; Child &gt; Student &gt; Normal. Highest score wins with rationale logged.
            </p>
          </div>
        </div>
        <div className="mt-5 text-center">
          <Link
            to="/demo"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <Sparkles className="h-4 w-4" /> Try the interactive Smart Allocation Demo page →
          </Link>
        </div>
      </section>
    </div>
  );
}
