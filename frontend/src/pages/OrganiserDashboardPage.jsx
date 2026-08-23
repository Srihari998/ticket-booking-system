import React, { useState, useEffect } from 'react';
import { fetchOrganiserEvents, fetchOrganiserSummary } from '../services/waitlistService';
import { createEvent } from '../services/eventService';
import { fetchVenues, fetchSeatCategories } from '../services/venueService';
import { DollarSign, Users, Ticket, TrendingUp, Plus, Calendar, MapPin, Eye, CheckCircle2, AlertCircle } from 'lucide-react';

export const OrganiserDashboardPage = () => {
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSummaryEvent, setSelectedSummaryEvent] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('MOVIE');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('18:30');
  const [venueId, setVenueId] = useState('');
  const [pricesMap, setPricesMap] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [eventsData, venuesData, categoriesData] = await Promise.all([
        fetchOrganiserEvents(),
        fetchVenues(),
        fetchSeatCategories()
      ]);
      setEvents(eventsData);
      setVenues(venuesData);
      setCategories(categoriesData);

      if (venuesData.length > 0) setVenueId(venuesData[0].id);

      const initialPrices = {};
      categoriesData.forEach((c) => {
        initialPrices[c.id] = c.name.toLowerCase().includes('premium') ? '295' : '175';
      });
      setPricesMap(initialPrices);
    } catch (err) {
      setError('Failed to load organiser dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePriceChange = (catId, val) => {
    setPricesMap({ ...pricesMap, [catId]: val });
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const categoryPrices = Object.entries(pricesMap).map(([catId, price]) => ({
      categoryId: parseInt(catId, 10),
      price: parseFloat(price)
    }));

    try {
      await createEvent({
        title,
        description,
        eventType,
        eventDate,
        startTime: `${startTime}:00`,
        venueId: parseInt(venueId, 10),
        categoryPrices
      });
      setSuccess('Event created successfully with venue seat layout!');
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewSummary = async (eventId) => {
    setSelectedSummaryEvent(eventId);
    setSummaryLoading(true);
    try {
      const data = await fetchOrganiserSummary(eventId);
      setSummaryData(data);
    } catch (err) {
      setError('Failed to fetch event summary.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const totalPlatformRevenue = events.reduce((sum, e) => sum + Number(e.totalRevenue || 0), 0);
  const totalPlatformBookings = events.reduce((sum, e) => sum + Number(e.total_bookings || 0), 0);
  const totalPlatformSeats = events.reduce((sum, e) => sum + Number(e.total_seats || 0), 0);
  const totalPlatformBookedSeats = events.reduce((sum, e) => sum + Number(e.booked_seats || 0), 0);
  const averageOccupancy = totalPlatformSeats > 0 ? ((totalPlatformBookedSeats / totalPlatformSeats) * 100).toFixed(1) : '0.0';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '6px' }}>Organiser Portal</h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time revenue, booking analytics, and event management.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} /> Create New Show / Event
        </button>
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

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value" style={{ color: '#059669' }}>₹{totalPlatformRevenue.toFixed(0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Bookings</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{totalPlatformBookings}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sold Tickets</div>
          <div className="stat-value">{totalPlatformBookedSeats} / {totalPlatformSeats}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Occupancy</div>
          <div className="stat-value" style={{ color: '#d97706' }}>{averageOccupancy}%</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', fontWeight: '800', fontSize: '18px' }}>
          Shows & Events in Guntur
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>Loading events...</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
            No events created yet. Click "Create New Show / Event" to get started.
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Event / Movie</th>
                  <th>Theatre / Venue</th>
                  <th>Date & Time</th>
                  <th>Occupancy</th>
                  <th>Bookings</th>
                  <th>Revenue</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <div style={{ fontWeight: '700' }}>{e.title}</div>
                      <span className="badge badge-secondary" style={{ marginTop: '4px' }}>{e.event_type}</span>
                    </td>
                    <td>{e.venue_name}</td>
                    <td>{new Date(e.event_date).toLocaleDateString()} {e.start_time.slice(0, 5)}</td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{e.occupancyPercentage}%</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{e.booked_seats} / {e.total_seats} seats</div>
                    </td>
                    <td>{e.total_bookings}</td>
                    <td style={{ fontWeight: '700', color: '#059669' }}>₹{Number(e.totalRevenue).toFixed(0)}</td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => handleViewSummary(e.id)}>
                        <Eye size={14} /> Analytics
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '18px' }}>Create New Show / Event Listing</h2>
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Devara: Part 1 (Telugu)"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Movie synopsis, cast details, etc."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={eventType} onChange={(e) => setEventType(e.target.value)}>
                    <option value="MOVIE">Movie</option>
                    <option value="CONCERT">Concert</option>
                    <option value="EVENT">Special Event</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Theatre / Venue</label>
                  <select className="form-select" value={venueId} onChange={(e) => setVenueId(e.target.value)} required>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.total_seats || 0} seats)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Show Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Show Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ margin: '16px 0', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>Ticket Pricing (₹ INR)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {categories.map((c) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600' }}>{c.name}</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        className="form-input"
                        style={{ width: '120px' }}
                        value={pricesMap[c.id] || ''}
                        onChange={(e) => handlePriceChange(c.id, e.target.value)}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? 'Creating...' : 'Publish Show'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedSummaryEvent && (
        <div className="modal-backdrop" onClick={() => setSelectedSummaryEvent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            {summaryLoading || !summaryData ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading metrics...</div>
            ) : (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>{summaryData.event.title}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
                  {summaryData.event.venue_name} &bull; {new Date(summaryData.event.event_date).toLocaleDateString()}
                </p>

                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '20px' }}>
                  <div className="stat-card" style={{ padding: '14px' }}>
                    <div className="stat-label">Total Revenue</div>
                    <div className="stat-value" style={{ fontSize: '20px', color: '#059669' }}>
                      ₹{summaryData.summary.totalRevenue.toFixed(0)}
                    </div>
                  </div>
                  <div className="stat-card" style={{ padding: '14px' }}>
                    <div className="stat-label">Occupancy</div>
                    <div className="stat-value" style={{ fontSize: '20px', color: 'var(--primary)' }}>
                      {summaryData.summary.occupancyPercentage}%
                    </div>
                  </div>
                  <div className="stat-card" style={{ padding: '14px' }}>
                    <div className="stat-label">Waitlist Queue</div>
                    <div className="stat-value" style={{ fontSize: '20px', color: '#d97706' }}>
                      {summaryData.summary.waitlistCount} waiting
                    </div>
                  </div>
                </div>

                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Category Breakdown</h4>
                <div className="table-responsive" style={{ marginBottom: '20px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Sold / Total</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryData.categoryBreakdown.map((c) => (
                        <tr key={c.category_id}>
                          <td><strong>{c.category_name}</strong></td>
                          <td>₹{Number(c.price).toFixed(0)}</td>
                          <td>{c.booked_seats} / {c.total_seats}</td>
                          <td style={{ fontWeight: '700' }}>₹{Number(c.categoryRevenue).toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setSelectedSummaryEvent(null)}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
