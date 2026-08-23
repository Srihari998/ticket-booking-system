import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { fetchBookingById } from '../services/bookingService';
import { CheckCircle2, QrCode, Calendar, MapPin, Printer } from 'lucide-react';

export const BookingSuccessPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!booking);

  useEffect(() => {
    if (!booking && id) {
      fetchBookingById(id)
        .then((data) => setBooking(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id, booking]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading booking confirmation...</div>;
  }

  if (!booking) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>Booking Not Found</h2>
        <Link to="/events" className="btn btn-primary">Browse Events</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px', margin: '20px auto 0' }}>
      <div className="card" style={{ textAlign: 'center', padding: '36px 24px', borderTop: '6px solid var(--success)' }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--success-light)', borderRadius: '50%', color: 'var(--success)', marginBottom: '16px' }}>
          <CheckCircle2 size={42} />
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '6px' }}>Booking Confirmed!</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
          Your digital ticket has been reserved. A confirmation email with your QR pass was generated.
        </p>

        <div style={{ background: '#f8fafc', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', padding: '24px', marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Booking Reference</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary)', margin: '4px 0 16px', letterSpacing: '1px' }}>
            {booking.bookingReference || booking.booking_reference}
          </div>

          {booking.qrDataUrl && (
            <div style={{ margin: '16px 0' }}>
              <img
                src={booking.qrDataUrl}
                alt="Ticket QR Code"
                style={{ width: '180px', height: '180px', margin: '0 auto', background: '#fff', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>Scan this QR code at the theatre entrance</p>
            </div>
          )}

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginTop: '16px' }}>{booking.eventTitle || booking.event_title}</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} /> {new Date(booking.eventDate || booking.event_date).toLocaleDateString()}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} /> {booking.venueName || booking.venue_name}
            </span>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Seats: <strong>{booking.seats?.map((s) => `${s.rowLabel || ''}${s.seatNumber || s.seat}`).join(', ')}</strong></span>
            <span>Total: <strong>₹{Number(booking.totalAmount || booking.total_amount).toFixed(0)}</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="btn btn-outline" onClick={() => window.print()}>
            <Printer size={16} /> Print Pass
          </button>
          <Link to="/my-bookings" className="btn btn-primary">
            View All Bookings
          </Link>
        </div>
      </div>
    </div>
  );
};
