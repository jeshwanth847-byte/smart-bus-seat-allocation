import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { UserCheck, ShieldCheck, Bus, Sparkles } from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const sel = (o) => o.map((x) => <option key={x[0]} value={x[0]}>{x[1]}</option>);
export const TYPES = [
  ['normal', 'Normal / General Passenger'],
  ['senior', 'Senior Citizen (60+ yrs)'],
  ['child', 'Child (under 12 yrs)'],
  ['pregnant', 'Pregnant Passenger'],
  ['disability', 'Person with Disability (PWD)'],
  ['student', 'Student']
];
export const ACCESS = [
  ['none', 'No Special Accessibility Requirement'],
  ['wheelchair', 'Wheelchair User (Level Access / Low Steps)'],
  ['reduced', 'Reduced Mobility (Front Seats Preferred)'],
  ['visual', 'Visual Assistance'],
  ['other', 'Other Special Support']
];
export const PREFS = [
  ['any', 'Any Seat (Algorithm Optimized)'],
  ['window', 'Window Seat'],
  ['aisle', 'Aisle Seat'],
  ['front', 'Front Row Preferred'],
  ['back', 'Rear Row Preferred']
];
export const inp = 'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
export { sel };

export default function Auth({ initialMode }) {
  const location = useLocation();
  const nav = useNavigate();
  const { login } = useAuth();

  const isRegisterRoute = initialMode === 'register' || location.pathname === '/register' || new URLSearchParams(location.search).get('mode') === 'register';
  const [reg, setReg] = useState(isRegisterRoute);

  useEffect(() => {
    if (initialMode === 'register' || location.pathname === '/register' || new URLSearchParams(location.search).get('mode') === 'register') {
      setReg(true);
    }
  }, [location, initialMode]);

  const [f, setF] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    age: '',
    gender: 'male',
    passengerType: 'normal',
    accessibilityRequirement: 'none',
    seatPreference: 'any'
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const endpoint = reg ? '/auth/register' : '/auth/login';
      const payload = reg ? f : { email: f.email, password: f.password };
      const { data } = await api.post(endpoint, payload);
      login(data);
      nav(data.user.role === 'passenger' ? '/' : '/admin');
    } catch (x) {
      setErr(x.friendly || x.response?.data?.message || 'Authentication failed. Please check your details.');
    } finally {
      setBusy(false);
    }
  };

  const quickFill = (email, role) => {
    setReg(false);
    setF((prev) => ({ ...prev, email, password: 'Password@123' }));
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-black text-slate-800 flex items-center justify-center gap-2">
          <Bus className="h-6 w-6 text-indigo-600" /> SmartBus Portal
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Intelligent rule-based bus seat allocation & reservation
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-indigo-100/50">
        {/* Tab Switcher */}
        <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => { setReg(false); setErr(''); }}
            className={`rounded-lg py-2 text-sm font-semibold transition ${!reg ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setReg(true); setErr(''); }}
            className={`rounded-lg py-2 text-sm font-semibold transition ${reg ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Register (1st Time User)
          </button>
        </div>

        {reg && (
          <div className="mb-5 rounded-xl border border-indigo-100 bg-indigo-50/70 p-3.5 text-xs text-indigo-900">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
              <div>
                <p className="font-semibold">First-time passenger registration</p>
                <p className="mt-0.5 text-indigo-700">
                  Fill in your details once so our rule-based engine can automatically prioritize accessible, group, and comfort seats for you!
                </p>
              </div>
            </div>
          </div>
        )}

        {err && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {reg && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Full Name *</label>
              <input
                className={inp}
                placeholder="e.g. Rahul Sharma"
                value={f.name}
                onChange={set('name')}
                required
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Email Address *</label>
            <input
              className={inp}
              type="email"
              placeholder="e.g. name@example.com"
              value={f.email}
              onChange={set('email')}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Password *</label>
            <input
              className={inp}
              type="password"
              placeholder="At least 6 characters"
              value={f.password}
              onChange={set('password')}
              required
              minLength={6}
            />
          </div>

          {reg && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Age *</label>
                  <input
                    className={inp}
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 28"
                    value={f.age}
                    onChange={set('age')}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Gender</label>
                  <select className={inp} value={f.gender} onChange={set('gender')}>
                    {sel([['male', 'Male'], ['female', 'Female'], ['other', 'Other']])}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Phone Number (Optional)</label>
                <input
                  className={inp}
                  placeholder="e.g. 9876543210"
                  value={f.phone}
                  onChange={set('phone')}
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Smart Allocation Preferences
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Passenger Category / Priority
                    </label>
                    <select className={inp} value={f.passengerType} onChange={set('passengerType')}>
                      {sel(TYPES)}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Accessibility Requirement
                    </label>
                    <select className={inp} value={f.accessibilityRequirement} onChange={set('accessibilityRequirement')}>
                      {sel(ACCESS)}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Seat Preference
                    </label>
                    <select className={inp} value={f.seatPreference} onChange={set('seatPreference')}>
                      {sel(PREFS)}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? 'Processing...' : reg ? 'Complete Registration & Sign In' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => { setReg(!reg); setErr(''); }}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            {reg ? 'Already have an account? Sign In here' : "First time user? Click here to Register"}
          </button>
        </div>

        {/* Demo Quick Logins */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="mb-2 text-center text-xs font-medium text-slate-400">
            Or test with one-click demo credentials:
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => quickFill('admin@smartbus.com', 'Admin')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 hover:bg-slate-100"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => quickFill('operator@smartbus.com', 'Operator')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 hover:bg-slate-100"
            >
              Operator
            </button>
            <button
              type="button"
              onClick={() => quickFill('passenger1@example.com', 'Passenger')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 hover:bg-slate-100"
            >
              Demo Passenger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
