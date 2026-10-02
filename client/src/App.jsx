import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Bus } from 'lucide-react';
import { useAuth } from './context/AuthContext.jsx';
import Home from './pages/Home.jsx';
import Auth from './pages/Auth.jsx';
import Book from './pages/Book.jsx';
import MyBookings from './pages/MyBookings.jsx';
import Demo from './pages/Demo.jsx';
import Admin from './pages/Admin.jsx';

const Protected = ({ roles, children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

export default function App() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <>
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 bg-indigo-700 px-6 py-3 text-white shadow">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold"><Bus /> SmartBus</Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link to="/demo">Smart Allocation Demo</Link>
          {user && <Link to="/bookings">My Bookings</Link>}
          {user && ['admin', 'operator'].includes(user.role) && <Link to="/admin">Dashboard</Link>}
            {user ? (
              <button onClick={() => { logout(); nav('/'); }} className="rounded-lg bg-white/20 px-3 py-1.5 transition hover:bg-white/30">
                Logout ({user.name.split(' ')[0]})
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="rounded-lg border border-white/40 px-3 py-1.5 text-white transition hover:bg-white/10">
                  Login
                </Link>
                <Link to="/register" className="rounded-lg bg-emerald-500 px-3.5 py-1.5 font-semibold text-white shadow-sm transition hover:bg-emerald-600">
                  Register
                </Link>
              </div>
            )}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl p-4 sm:p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth initialMode="register" />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/book/:id" element={<Protected><Book /></Protected>} />
          <Route path="/bookings" element={<Protected><MyBookings /></Protected>} />
          <Route path="/admin" element={<Protected roles={['admin', 'operator']}><Admin /></Protected>} />
          <Route path="*" element={<p className="p-10 text-center">Page not found</p>} />
        </Routes>
      </main>
    </>
  );
}
