import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEventById, fetchEventSeats, holdSeats } from '../services/eventService';
import { joinWaitlist } from '../services/waitlistService';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { SeatMap } from '../components/SeatMap';
import { CountdownTimer } from '../components/CountdownTimer';
import { Calendar, MapPin, Tag, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [eventData, setEventData] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [myHeldSeatIds, setMyHeldSeatIds] = useState([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [holding, setHolding] = useState(false);

  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistCategory, setWaitlistCategory] = useState('');
  const [waitlistQuantity, setWaitlistQuantity] = useState(1);
  const [waitlistSuccess, setWaitlistSuccess] = useState(null);
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [detailRes, seatsRes] = await Promise.all([
        fetchEventById(id),
        fetchEventSeats(id)
      ]);
      setEventData(detailRes);
      setSeats(seatsRes);

      const existingMyHolds = seatsRes.filter((s) => s.isMyHold);
      if (existingMyHolds.length > 0) {
        setMyHeldSeatIds(existingMyHolds.map((s) => s.id));
        setHoldExpiresAt(existingMyHolds[0].holdExpiresAt);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('joinEvent', parseInt(id, 10));

    const handleSeatUpdated = (data) => {
      if (parseInt(data.eventId, 10) !== parseInt(id, 10)) return;

      setSeats((prevSeats) => {
        const updatedMap = new Map(data.seats.map((s) => [s.id, s]));
        return prevSeats.map((seat) => {
          if (updatedMap.has(seat.id)) {
            const update = updatedMap.get(seat.id);
            return {
              ...seat,
              status: update.status,
              holdExpiresAt: update.holdExpiresAt
            };
          }
          return seat;
        });
      });
    };

    socket.on('seatUpdated', handleSeatUpdated);

    return () => {
      socket.emit('leaveEvent', parseInt(id, 10));
      socket.off('seatUpdated', handleSeatUpdated);
    };
  }, [socket, id]);

  const handleToggleSeat = (seat) => {
    setError('');
    const seatId = seat.id;
    if (selectedSeatIds.includes(seatId)) {
      setSelectedSeatIds(selectedSeatIds.filter((sid) => sid !== seatId));
    } else {
      setSelectedSeatIds([...selectedSeatIds, seatId]);
    }
  };

  const handleHoldAndProceed = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/events/${id}` } } });
      return;
    }

    if (selectedSeatIds.length === 0) {
      setError('Please select at least one available seat to hold.');
      return;
    }

    setHolding(true);
    setError('');

    try {
      const holdResult = await holdSeats(id, selectedSeatIds);
      setMyHeldSeatIds(selectedSeatIds);
      setHoldExpiresAt(holdResult.expiresAt);

      navigate('/checkout', {
        state: {
          eventId: id,
          eventTitle: eventData.event.title,
          venueName: eventData.event.venue_name,
          eventDate: eventData.event.event_date,
          startTime: eventData.event.start_time,
          seatIds: selectedSeatIds,
          selectedSeats: seats.filter((s) => selectedSeatIds.includes(s.id)),
          expiresAt: holdResult.expiresAt
        }
      });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'One or more selected seats could not be held.');
      await loadData();
    } finally {
      setHolding(false);
    }
  };

  const handleJoinWaitlist = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/events/${id}` } } });
      return;
    }

    setWaitlistSubmitting(true);
    setError('');
    try {
      const result = await joinWaitlist(id, parseInt(waitlistCategory, 10), parseInt(waitlistQuantity, 10));
      setWaitlistSuccess(result);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to join waitlist.');
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>Loading event seat layout...</div>;
  }

  if (!eventData) {
    return <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Event not found</div>;
  }

  const { event, pricing, stats } = eventData;
  const selectedSeatsList = seats.filter((s) => selectedSeatIds.includes(s.id));
  const totalPrice = selectedSeatsList.reduce((sum, s) => sum + Number(s.price || 0), 0);
  const isSoldOut = stats.available_seats === 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
            <span className="badge badge-secondary">{event.event_type}</span>
            {isSoldOut ? (
              <span className="badge badge-danger">SOLD OUT</span>
            ) : (
              <span className="badge badge-success">{stats.available_seats} of {stats.total_seats} Available</span>
            )}
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>{event.title}</h1>
          <div style={{ display: 'flex', gap: '18px', color: 'var(--text-muted)', fontSize: '14px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} className="text-indigo-600" />
              {new Date(event.event_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {event.start_time.slice(0, 5)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={16} className="text-indigo-600" />
              {event.venue_name}, {event.venue_location}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn btn-outline" onClick={() => setShowWaitlistModal(true)}>
            <Clock size={16} /> Join Waitlist
          </button>
        </div>
      </div>

      {holdExpiresAt && (
        <div style={{ marginBottom: '20px' }}>
          <CountdownTimer expiresAt={holdExpiresAt} label="Your temporary seat hold expires in:" />
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        <div>
          <SeatMap
            seats={seats}
            selectedSeatIds={selectedSeatIds}
            myHeldSeatIds={myHeldSeatIds}
            onToggleSeat={handleToggleSeat}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>Category Pricing</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pricing.map((p) => (
                <div key={p.category_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontWeight: '600' }}>{p.category_name}</span>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.category_description}</p>
                  </div>
                  <span style={{ fontWeight: '800', color: 'var(--primary)' }}>₹{Number(p.price).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>Selected Seats</h3>

            {selectedSeatsList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                Click on any available seat to select.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {selectedSeatsList.map((s) => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', background: '#f8fafc', padding: '6px 10px', borderRadius: '4px' }}>
                      <span>Seat {s.rowLabel}{s.seatNumber} ({s.categoryName})</span>
                      <span style={{ fontWeight: '700' }}>₹{Number(s.price).toFixed(0)}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border)', fontWeight: '800', fontSize: '16px' }}>
                  <span>Total:</span>
                  <span style={{ color: 'var(--primary)' }}>₹{totalPrice.toFixed(0)}</span>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '6px' }}
                  onClick={handleHoldAndProceed}
                  disabled={holding}
                >
                  {holding ? 'Securing Hold...' : `Hold & Checkout (${selectedSeatsList.length})`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showWaitlistModal && (
        <div className="modal-backdrop" onClick={() => setShowWaitlistModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Join Event Waitlist</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
              When a seat opens up due to cancellation or hold expiry, FIFO offers are emailed with a 10-minute booking window.
            </p>

            {waitlistSuccess ? (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '20px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <CheckCircle2 size={36} style={{ color: '#059669', margin: '0 auto 10px' }} />
                <h4 style={{ color: '#065f46', fontWeight: '700', fontSize: '16px', marginBottom: '6px' }}>Waitlist Joined!</h4>
                <p style={{ fontSize: '13px', color: '#047857', marginBottom: '14px' }}>
                  You are #{waitlistSuccess.queuePosition} in the FIFO queue. You will receive an email as soon as a seat becomes available.
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => { setShowWaitlistModal(false); setWaitlistSuccess(null); }}>
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleJoinWaitlist}>
                <div className="form-group">
                  <label className="form-label">Select Category</label>
                  <select
                    className="form-select"
                    value={waitlistCategory}
                    onChange={(e) => setWaitlistCategory(e.target.value)}
                    required
                  >
                    <option value="">Choose Category</option>
                    {pricing.map((p) => (
                      <option key={p.category_id} value={p.category_id}>
                        {p.category_name} (₹{Number(p.price).toFixed(0)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    className="form-input"
                    value={waitlistQuantity}
                    onChange={(e) => setWaitlistQuantity(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowWaitlistModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={waitlistSubmitting}>
                    {waitlistSubmitting ? 'Joining...' : 'Confirm Waitlist'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
