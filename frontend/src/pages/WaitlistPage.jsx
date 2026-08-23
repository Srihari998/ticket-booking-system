import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchUserWaitlists, cancelWaitlistEntry } from '../services/waitlistService';
import { Clock, CheckCircle2, AlertCircle, ArrowRight, XCircle } from 'lucide-react';

export const WaitlistPage = () => {
  const [waitlists, setWaitlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadWaitlists = async () => {
    try {
      const data = await fetchUserWaitlists();
      setWaitlists(data);
    } catch (err) {
      setError('Failed to fetch waitlist entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWaitlists();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this waitlist entry?')) return;
    try {
      await cancelWaitlistEntry(id);
      setSuccess('Waitlist entry cancelled.');
      await loadWaitlists();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to cancel waitlist');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OFFERED':
        return <span className="badge badge-warning">OFFER ACTIVE (CLAIM NOW)</span>;
      case 'WAITING':
        return <span className="badge badge-primary">IN QUEUE</span>;
      case 'COMPLETED':
        return <span className="badge badge-success">BOOKED</span>;
      case 'EXPIRED':
        return <span className="badge badge-danger">EXPIRED</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>My Waitlist Entries</h1>
        <p style={{ color: 'var(--text-muted)' }}>Track your FIFO queue positions and claim time-limited seat offers.</p>
      </div>

      {success && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading waitlist...</div>
      ) : waitlists.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <Clock size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>No Active Waitlist Entries</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>When an event category is sold out, you can join the FIFO queue from its page.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {waitlists.map((entry) => (
            <div key={entry.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  {getStatusBadge(entry.status)}
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Joined {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{entry.event_title}</h3>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Category: <strong>{entry.category_name}</strong> &bull; Quantity: <strong>{entry.quantity} seat(s)</strong> &bull; Venue: {entry.venue_name}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {entry.status === 'OFFERED' && entry.active_offer_token && (
                  <Link to={`/waitlist-offer/${entry.active_offer_token}`} className="btn btn-primary btn-sm">
                    Claim Offer <ArrowRight size={15} />
                  </Link>
                )}
                {['WAITING', 'OFFERED'].includes(entry.status) && (
                  <button className="btn btn-outline btn-sm" onClick={() => handleCancel(entry.id)}>
                    <XCircle size={15} /> Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
