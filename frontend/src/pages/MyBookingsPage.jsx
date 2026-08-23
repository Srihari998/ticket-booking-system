import React, { useState, useEffect } from 'react';
import { fetchUserBookings, cancelBooking, fetchBookingById } from '../services/bookingService';
import { BookmarkCheck, Calendar, MapPin, QrCode, XCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

export const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeQRBooking, setActiveQRBooking] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const loadBookings = async () => {
    try {
      const data = await fetchUserBookings();
      setBookings(data);
    } catch (err) {
      setError('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? Released seats will be made available or offered to the waitlist.')) {
      return;
    }

    setCancellingId(bookingId);
    setError('');
    setSuccessMsg('');

    try {
      await cancelBooking(bookingId);
      setSuccessMsg('Booking cancelled successfully. Seats have been released.');
      await loadBookings();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleViewQR = async (bookingId) => {
    try {
      const details = await fetchBookingById(bookingId);
      setActiveQRBooking(details);
    } catch (err) {
      setError('Failed to retrieve ticket QR code.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>My Bookings</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your reserved tickets and view digital QR entry passes.</p>
      </div>

      {successMsg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading booking history...</div>
      ) : bookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <BookmarkCheck size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>No Bookings Yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Browse upcoming movies and concerts in Guntur to book your first seat.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {bookings.map((b) => {
            const isCancelled = b.status === 'CANCELLED';
            return (
              <div key={b.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', opacity: isCancelled ? 0.65 : 1 }}>
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary)' }}>{b.bookingReference}</span>
                    <span className={`badge badge-${isCancelled ? 'danger' : 'success'}`}>
                      {b.status}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>{b.eventTitle}</h3>
                  <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '13px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} /> {new Date(b.eventDate).toLocaleDateString()} at {b.startTime?.slice(0, 5)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} /> {b.venueName}
                    </span>
                  </div>

                  <div style={{ marginTop: '10px', fontSize: '13px' }}>
                    Seats: <strong>{b.seats.map((s) => s.seat).join(', ')}</strong> &bull; Total: <strong>₹{Number(b.totalAmount).toFixed(0)}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {!isCancelled && (
                    <>
                      <button className="btn btn-outline btn-sm" onClick={() => handleViewQR(b.id)}>
                        <QrCode size={16} /> View QR Ticket
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancelBooking(b.id)}
                        disabled={cancellingId === b.id}
                      >
                        <XCircle size={16} /> {cancellingId === b.id ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                    </>
                  )}
                  {isCancelled && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Cancelled on {new Date(b.cancelledAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeQRBooking && (
        <div className="modal-backdrop" onClick={() => setActiveQRBooking(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>{activeQRBooking.eventTitle}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '18px' }}>
              Reference: <strong style={{ color: 'var(--primary)' }}>{activeQRBooking.bookingReference}</strong>
            </p>

            <img
              src={activeQRBooking.qrDataUrl}
              alt="Ticket QR"
              style={{ width: '220px', height: '220px', margin: '0 auto 16px', background: '#fff', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}
            />

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '13px', textAlign: 'left', marginBottom: '20px' }}>
              <div><strong>Theatre:</strong> {activeQRBooking.venueName}</div>
              <div style={{ marginTop: '4px' }}><strong>Date:</strong> {new Date(activeQRBooking.eventDate).toLocaleDateString()} at {activeQRBooking.startTime?.slice(0, 5)}</div>
              <div style={{ marginTop: '4px' }}><strong>Seats:</strong> {activeQRBooking.seats?.map((s) => s.seat).join(', ')}</div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setActiveQRBooking(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
