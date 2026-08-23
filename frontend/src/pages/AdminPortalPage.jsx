import React, { useState, useEffect } from 'react';
import { fetchEvents, createEvent, updateEvent, cancelEvent, fetchEventSeats } from '../services/eventService';
import { fetchVenues, createVenue } from '../services/venueService';
import { SeatMap } from '../components/SeatMap';
import { Film, Building2, Plus, Edit3, Trash2, CheckCircle2, AlertCircle, LayoutGrid, Calendar, Clock, MapPin } from 'lucide-react';

export const AdminPortalPage = () => {
  const [activeTab, setActiveTab] = useState('movies');
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    eventType: 'MOVIE',
    eventDate: '',
    startTime: '18:30:00',
    venueId: '',
    premiumPrice: 295,
    standardPrice: 175
  });

  const [showVenueModal, setShowVenueModal] = useState(false);
  const [venueForm, setVenueForm] = useState({
    name: '',
    location: '',
    rowCount: 5,
    seatsPerRow: 6
  });

  const [selectedSeatEventId, setSelectedSeatEventId] = useState('');
  const [layoutSeats, setLayoutSeats] = useState([]);
  const [layoutLoading, setLayoutLoading] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [evts, vns] = await Promise.all([fetchEvents({}), fetchVenues()]);
      setEvents(evts);
      setVenues(vns);
      if (evts.length > 0 && !selectedSeatEventId) {
        setSelectedSeatEventId(evts[0].id.toString());
      }
    } catch {
      setError('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!selectedSeatEventId) return;
    const loadSeats = async () => {
      setLayoutLoading(true);
      try {
        const s = await fetchEventSeats(selectedSeatEventId);
        setLayoutSeats(s);
      } catch {
        setLayoutSeats([]);
      } finally {
        setLayoutLoading(false);
      }
    };
    loadSeats();
  }, [selectedSeatEventId]);

  const openCreateMovieModal = () => {
    setEditingEvent(null);
    setMovieForm({
      title: '',
      description: '',
      eventType: 'MOVIE',
      eventDate: new Date().toISOString().slice(0, 10),
      startTime: '18:30:00',
      venueId: venues.length > 0 ? venues[0].id.toString() : '1',
      premiumPrice: 295,
      standardPrice: 175
    });
    setShowEventModal(true);
  };

  const openEditMovieModal = (evt) => {
    setEditingEvent(evt);
    const prem = evt.prices?.find((p) => p.categoryId === 1 || p.category_id === 1)?.price || 295;
    const std = evt.prices?.find((p) => p.categoryId === 2 || p.category_id === 2)?.price || 175;
    setMovieForm({
      title: evt.title,
      description: evt.description || '',
      eventType: evt.event_type,
      eventDate: evt.event_date ? new Date(evt.event_date).toISOString().slice(0, 10) : '',
      startTime: evt.start_time || '18:30:00',
      venueId: evt.venue_id ? evt.venue_id.toString() : (venues[0]?.id.toString() || '1'),
      premiumPrice: Number(prem),
      standardPrice: Number(std)
    });
    setShowEventModal(true);
  };

  const handleSaveMovie = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = {
        title: movieForm.title,
        description: movieForm.description,
        eventType: movieForm.eventType,
        eventDate: movieForm.eventDate,
        startTime: movieForm.startTime,
        venueId: parseInt(movieForm.venueId, 10),
        categoryPrices: [
          { categoryId: 1, price: Number(movieForm.premiumPrice) },
          { categoryId: 2, price: Number(movieForm.standardPrice) }
        ]
      };

      if (editingEvent) {
        await updateEvent(editingEvent.id, payload);
        setSuccess(`Successfully updated "${movieForm.title}"`);
      } else {
        await createEvent(payload);
        setSuccess(`Successfully created movie showtime "${movieForm.title}"`);
      }
      setShowEventModal(false);
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save movie details');
    }
  };

  const handleCancelMovie = async (evtId) => {
    if (!window.confirm('Are you sure you want to cancel this movie show?')) return;
    setError('');
    setSuccess('');
    try {
      await cancelEvent(evtId);
      setSuccess('Movie show cancelled successfully');
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to cancel show');
    }
  };

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, parseInt(venueForm.rowCount, 10));
      const seats = [];
      rowLabels.forEach((r, idx) => {
        const isPrem = idx < 2;
        for (let i = 1; i <= parseInt(venueForm.seatsPerRow, 10); i++) {
          seats.push({
            rowLabel: r,
            seatNumber: i,
            categoryId: isPrem ? 1 : 2
          });
        }
      });

      await createVenue({
        name: venueForm.name,
        location: venueForm.location,
        seats
      });

      setSuccess(`Theater "${venueForm.name}" created with ${seats.length} seats!`);
      setShowVenueModal(false);
      setVenueForm({ name: '', location: '', rowCount: 5, seatsPerRow: 6 });
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create theater');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>Loading Admin Portal...</div>;
  }

  const selectedEventObj = events.find((e) => e.id.toString() === selectedSeatEventId) || events[0];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
            <span className="badge badge-danger">ADMIN PORTAL</span>
            <span className="badge badge-primary">Guntur Region</span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800' }}>Master Administration Console</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Manage Guntur theaters, movie listings, showtimes, and physical seat allotments</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={openCreateMovieModal}>
            <Plus size={16} /> Add New Movie
          </button>
          <button className="btn btn-outline" onClick={() => setShowVenueModal(true)}>
            <Building2 size={16} /> Add New Theater
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px' }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', marginBottom: '24px' }}>
        <button
          className={`btn ${activeTab === 'movies' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '6px 6px 0 0', borderBottom: 'none' }}
          onClick={() => setActiveTab('movies')}
        >
          <Film size={16} /> Movies & Showtimes ({events.length})
        </button>
        <button
          className={`btn ${activeTab === 'venues' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '6px 6px 0 0', borderBottom: 'none' }}
          onClick={() => setActiveTab('venues')}
        >
          <Building2 size={16} /> Theaters & Complexes ({venues.length})
        </button>
        <button
          className={`btn ${activeTab === 'seats' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '6px 6px 0 0', borderBottom: 'none' }}
          onClick={() => setActiveTab('seats')}
        >
          <LayoutGrid size={16} /> Seat Allotment & Live Status
        </button>
      </div>

      {activeTab === 'movies' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {events.map((evt) => {
              const premPrice = evt.prices?.find((p) => p.categoryId === 1 || p.category_id === 1)?.price || 295;
              const stdPrice = evt.prices?.find((p) => p.categoryId === 2 || p.category_id === 2)?.price || 175;
              return (
                <div key={evt.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid var(--primary)' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span className="badge badge-secondary">{evt.event_type}</span>
                      <span className={`badge badge-${evt.status === 'PUBLISHED' ? 'success' : 'danger'}`}>{evt.status}</span>
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px' }}>{evt.title}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {evt.description}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', background: '#f8fafc', padding: '10px', borderRadius: 'var(--radius-sm)', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} className="text-indigo-600" />
                        <strong style={{ color: 'var(--text)' }}>Theater:</strong> {evt.venue_name || 'Guntur Theatre'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} className="text-indigo-600" />
                        <span>{new Date(evt.event_date).toLocaleDateString()} at {evt.start_time?.slice(0, 5)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} className="text-indigo-600" />
                        <span>Pricing: Premium: <strong>₹{premPrice}</strong> | Standard: <strong>₹{stdPrice}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                    <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => openEditMovieModal(evt)}>
                      <Edit3 size={14} /> Edit Show / Theater
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleCancelMovie(evt.id)} title="Cancel Show">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'venues' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {venues.map((v) => (
              <div key={v.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ padding: '10px', background: 'var(--primary-light)', borderRadius: '8px', color: 'var(--primary)' }}>
                    <Building2 size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '800' }}>{v.name}</h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Guntur, AP</span>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} /> {v.location}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '4px', fontSize: '13px' }}>
                  <span>Total Capacity:</span>
                  <strong>{v.total_seats || 30} Seats</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'seats' && (
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontWeight: '700', fontSize: '14px' }}>Select Movie / Show for Layout & Allotment:</label>
              <select
                className="form-select"
                style={{ maxWidth: '400px' }}
                value={selectedSeatEventId}
                onChange={(e) => setSelectedSeatEventId(e.target.value)}
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} — ({e.venue_name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedEventObj && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
              <div>
                {layoutLoading ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>Loading seat layout...</div>
                ) : (
                  <SeatMap seats={layoutSeats} selectedSeatIds={[]} onToggleSeat={() => {}} disabled={true} />
                )}
              </div>

              <div className="card">
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Live Seat Inventory</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#ecfdf5', borderRadius: '4px', color: '#065f46', fontWeight: '700' }}>
                    <span>Available Seats:</span>
                    <span>{layoutSeats.filter((s) => s.status === 'AVAILABLE').length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#fef3c7', borderRadius: '4px', color: '#92400e', fontWeight: '700' }}>
                    <span>Currently Held:</span>
                    <span>{layoutSeats.filter((s) => s.status === 'HELD').length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#f1f5f9', borderRadius: '4px', color: '#475569', fontWeight: '700' }}>
                    <span>Confirmed Booked:</span>
                    <span>{layoutSeats.filter((s) => s.status === 'BOOKED').length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderTop: '1px solid var(--border)', fontWeight: '800' }}>
                    <span>Total Auditorium:</span>
                    <span>{layoutSeats.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showEventModal && (
        <div className="modal-backdrop" onClick={() => setShowEventModal(false)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>
              {editingEvent ? 'Edit Movie & Playing Theater' : 'Add New Movie Listing'}
            </h3>

            <form onSubmit={handleSaveMovie}>
              <div className="form-group">
                <label className="form-label">Movie / Show Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={movieForm.title}
                  onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  placeholder="e.g. Devara: Part 1 (Telugu)"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={movieForm.description}
                  onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                  placeholder="Cast, director, music director, and synopsis..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Event Type</label>
                  <select
                    className="form-select"
                    value={movieForm.eventType}
                    onChange={(e) => setMovieForm({ ...movieForm, eventType: e.target.value })}
                  >
                    <option value="MOVIE">MOVIE</option>
                    <option value="CONCERT">CONCERT</option>
                    <option value="EVENT">LIVE EVENT</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Playing Theater (Guntur)</label>
                  <select
                    className="form-select"
                    value={movieForm.venueId}
                    onChange={(e) => setMovieForm({ ...movieForm, venueId: e.target.value })}
                    required
                  >
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Show Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={movieForm.eventDate}
                    onChange={(e) => setMovieForm({ ...movieForm, eventDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Show Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={movieForm.startTime}
                    onChange={(e) => setMovieForm({ ...movieForm, startTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Premium Ticket Price (₹)</label>
                  <input
                    type="number"
                    min="50"
                    step="1"
                    className="form-input"
                    value={movieForm.premiumPrice}
                    onChange={(e) => setMovieForm({ ...movieForm, premiumPrice: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Standard Ticket Price (₹)</label>
                  <input
                    type="number"
                    min="50"
                    step="1"
                    className="form-input"
                    value={movieForm.standardPrice}
                    onChange={(e) => setMovieForm({ ...movieForm, standardPrice: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowEventModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingEvent ? 'Save Changes' : 'Publish Movie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVenueModal && (
        <div className="modal-backdrop" onClick={() => setShowVenueModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>Add New Theater (Guntur)</h3>

            <form onSubmit={handleCreateVenue}>
              <div className="form-group">
                <label className="form-label">Theater Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={venueForm.name}
                  onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
                  placeholder="e.g. Syamala Deluxe 4K"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location / Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={venueForm.location}
                  onChange={(e) => setVenueForm({ ...venueForm, location: e.target.value })}
                  placeholder="e.g. Pattabhipuram Main Road, Guntur"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Number of Rows</label>
                  <input
                    type="number"
                    min="2"
                    max="8"
                    className="form-input"
                    value={venueForm.rowCount}
                    onChange={(e) => setVenueForm({ ...venueForm, rowCount: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Seats per Row</label>
                  <input
                    type="number"
                    min="4"
                    max="10"
                    className="form-input"
                    value={venueForm.seatsPerRow}
                    onChange={(e) => setVenueForm({ ...venueForm, seatsPerRow: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowVenueModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Create Theater
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
