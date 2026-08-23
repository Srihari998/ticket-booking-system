import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchOfferByToken, acceptWaitlistOffer } from '../services/waitlistService';
import { CountdownTimer } from '../components/CountdownTimer';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Calendar, MapPin, AlertCircle, ShieldCheck } from 'lucide-react';

export const WaitlistOfferPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  const loadOffer = async () => {
    try {
      const data = await fetchOfferByToken(token);
      setOffer(data);
      if (data.isExpired) {
        setIsExpired(true);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid or expired waitlist offer.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffer();
  }, [token]);

  const handleAccept = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/waitlist-offer/${token}` } } });
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const result = await acceptWaitlistOffer(token);
      navigate(`/booking-success/${result.bookingId}`, {
        state: {
          booking: {
            ...result,
            eventTitle: offer.event.title,
            venueName: offer.event.venueName,
            eventDate: offer.event.eventDate,
            startTime: offer.event.startTime,
            seats: offer.seats.map((s) => ({
              seat: `${s.rowLabel}${s.seatNumber}`,
              categoryName: offer.category.name,
              price: offer.category.unitPrice
            }))
          }
        }
      });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to claim waitlist offer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Validating waitlist offer...</div>;
  }

  if (error || !offer) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>Offer Unavailable</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>{error || 'This offer does not exist or has expired.'}</p>
        <Link to="/events" className="btn btn-primary">Browse Events</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px', margin: '20px auto 0' }}>
      <div className="card" style={{ padding: '36px', borderTop: '6px solid var(--success)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', padding: '14px', background: '#ecfdf5', borderRadius: '50%', color: '#059669', marginBottom: '12px' }}>
            <Sparkles size={36} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Your Waitlist Offer is Ready!</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            A matching seat has opened up for you in Guntur. Complete your reservation before the timer expires.
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <CountdownTimer expiresAt={offer.expiresAt} onExpire={() => setIsExpired(true)} label="Time remaining to claim:" />
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px' }}>{offer.event.title}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} /> {new Date(offer.event.eventDate).toLocaleDateString()} at {offer.event.startTime?.slice(0, 5)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} /> {offer.event.venueName}, {offer.event.venueLocation}
            </span>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Category:</span>
              <strong>{offer.category.name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Allocated Seats:</span>
              <strong>{offer.seats.map((s) => `${s.rowLabel}${s.seatNumber}`).join(', ')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '10px', fontSize: '16px', fontWeight: '800' }}>
              <span>Total Payable:</span>
              <span style={{ color: 'var(--primary)' }}>₹{Number(offer.totalAmount).toFixed(0)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#059669', marginBottom: '20px', background: '#ecfdf5', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
          <ShieldCheck size={16} />
          <span>Seats held exclusively for your waitlist token</span>
        </div>

        <button
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
          onClick={handleAccept}
          disabled={submitting || isExpired}
        >
          {submitting ? 'Confirming Ticket Reservation...' : isExpired ? 'Offer Expired' : 'Accept Offer & Confirm Tickets'}
        </button>
      </div>
    </div>
  );
};
