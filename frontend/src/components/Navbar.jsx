import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ticket, Calendar, Clock, BookmarkCheck, LogOut, LayoutDashboard, ShieldCheck, LogIn } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/events" className="nav-brand">
          <Ticket className="w-6 h-6 text-indigo-600" />
          <span>TicketEase</span>
        </Link>

        <nav className="nav-links">
          <Link to="/events" className={`nav-link ${isActive('/events') ? 'active' : ''}`}>
            <span className="flex items-center gap-1.5"><Calendar size={16} /> Browse Events</span>
          </Link>

          {user && user.role === 'CUSTOMER' && (
            <>
              <Link to="/my-bookings" className={`nav-link ${isActive('/my-bookings') ? 'active' : ''}`}>
                <span className="flex items-center gap-1.5"><BookmarkCheck size={16} /> My Bookings</span>
              </Link>
              <Link to="/waitlist" className={`nav-link ${isActive('/waitlist') ? 'active' : ''}`}>
                <span className="flex items-center gap-1.5"><Clock size={16} /> Waitlist</span>
              </Link>
            </>
          )}

          {user && user.role === 'ORGANISER' && (
            <Link to="/organiser" className={`nav-link ${isActive('/organiser') ? 'active' : ''}`}>
              <span className="flex items-center gap-1.5"><LayoutDashboard size={16} /> Organiser Portal</span>
            </Link>
          )}

          {user && user.role === 'ADMIN' && (
            <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
              <span className="flex items-center gap-1.5"><ShieldCheck size={16} /> Admin Portal</span>
            </Link>
          )}
        </nav>

        <div className="nav-user">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: '700' }}>{user.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span className={`badge badge-${user.role === 'ADMIN' ? 'danger' : user.role === 'ORGANISER' ? 'warning' : 'primary'}`}>
                    {user.role}
                  </span>
                </div>
              </div>
              <button onClick={handleLogout} className="btn btn-outline btn-sm" title="Log out">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/login" className="btn btn-outline btn-sm">
                <LogIn size={15} /> Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
