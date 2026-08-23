import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ticket, AlertCircle } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/events';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else if (user.role === 'ORGANISER') {
        navigate('/organiser');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillQuickCredentials = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  return (
    <div style={{ maxWidth: '440px', margin: '40px auto 0', width: '100%' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', padding: '12px', background: 'var(--primary-light)', borderRadius: '50%', color: 'var(--primary)', marginBottom: '12px' }}>
            <Ticket size={28} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Log in to manage bookings and tickets</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '18px', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={submitting}>
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border)', fontSize: '13px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '700' }}>
            Create one
          </Link>
        </div>

        <div style={{ marginTop: '20px', background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
          <div style={{ fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>Quick Demo Logins:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ justifyContent: 'flex-start', fontSize: '11px' }}
              onClick={() => fillQuickCredentials('admin@example.com', 'Admin@123')}
            >
              Admin: admin@example.com / Admin@123 (Manage Theaters & Movies)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ justifyContent: 'flex-start', fontSize: '11px' }}
              onClick={() => fillQuickCredentials('customer@example.com', 'Customer@123')}
            >
              Customer: customer@example.com / Customer@123
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ justifyContent: 'flex-start', fontSize: '11px' }}
              onClick={() => fillQuickCredentials('organiser@example.com', 'Organiser@123')}
            >
              Organiser: organiser@example.com / Organiser@123
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
