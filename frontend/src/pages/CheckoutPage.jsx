import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { createBooking } from '../services/bookingService';
import { CountdownTimer } from '../components/CountdownTimer';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, AlertCircle, Calendar, MapPin, ArrowLeft } from 'lucide-react';

export const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const state = location.state;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  if (!state || !state.seatIds || state.seatIds.length === 0) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>No Active Seat Hold Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Please choose an event and select available seats first.</p>
        <Link to="/events" className="btn btn-primary">Browse Events</Link>
      </div>
    );
  }

  const { eventId, eventTitle, venueName, eventDate, startTime, selectedSeats, expiresAt } = state;
  const totalPrice = selectedSeats.reduce((sum, s) => sum + Number(s.price || 0), 0);

  const handleConfirmBooking = async () => {
    if (isExpired) {
      setError('Seat hold has expired. Please select your seats again.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const result = await createBooking(eventId, state.seatIds);
      navigate(`/booking-success/${result.bookingId}`, {
        state: {
          booking: {
            ...result,
            eventTitle,
            venueName,
            eventDate,
            startTime,
            totalAmount: totalPrice,
            seats: selectedSeats
          }
        }
      });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Booking confirmation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <Link to={`/events/${eventId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '20px' }}>
        <ArrowLeft size={16} /> Back to Seat Map
      </Link>

      <div style={{ marginBottom: '24px' }}>
        <CountdownTimer expiresAt={expiresAt} onExpire={() => setIsExpired(true)} label="Hold Guarantee:" />
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>Event Summary</h2>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)', marginBottom: '8px' }}>{eventTitle}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={15} /> {new Date(eventDate).toLocaleDateString()} at {startTime?.slice(0, 5)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={15} /> {venueName}
            </span>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>Customer Details</h4>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
            <div><strong>Name:</strong> {user?.name}</div>
            <div style={{ marginTop: '4px' }}><strong>Email:</strong> {user?.email}</div>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>Order Breakdown</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {selectedSeats.map((s) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>Seat {s.rowLabel}{s.seatNumber} ({s.categoryName})</span>
                <span style={{ fontWeight: '700' }}>₹{Number(s.price).toFixed(0)}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '2px solid var(--border)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '18px', fontWeight: '800', marginBottom: '24px' }}>
            <span>Total Payable:</span>
            <span style={{ color: 'var(--primary)' }}>₹{totalPrice.toFixed(0)}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#059669', marginBottom: '16px', background: '#ecfdf5', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
            <ShieldCheck size={16} />
            <span>Instant Secure Seat Confirmation</span>
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            onClick={handleConfirmBooking}
            disabled={submitting || isExpired}
          >
            {submitting ? 'Confirming Transaction...' : 'Complete Booking'}
          </button>
        </div>
      </div>
    </div>
  );
};
