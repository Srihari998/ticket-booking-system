import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchEvents } from '../services/eventService';
import { Search, Calendar, MapPin, Tag, Film, Music, Sparkles } from 'lucide-react';

export const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('');
  const [startDate, setStartDate] = useState('');

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await fetchEvents({
        search: search || undefined,
        eventType: eventType || undefined,
        startDate: startDate || undefined
      });
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [eventType, startDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadEvents();
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'MOVIE':
        return <Film size={18} className="text-blue-500" />;
      case 'CONCERT':
        return <Music size={18} className="text-purple-500" />;
      default:
        return <Sparkles size={18} className="text-amber-500" />;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Explore Events & Shows</h1>
        <p style={{ color: 'var(--text-muted)' }}>Book your favorite concert and movie seats in Guntur with real-time availability.</p>
      </div>

      <div className="card" style={{ marginBottom: '32px', padding: '18px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search Event or Theatre</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', paddingLeft: '36px' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search movies, concerts, theatres..."
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Category</label>
            <select className="form-select" value={eventType} onChange={(e) => setEventType(e.target.value)}>
              <option value="">All Categories</option>
              <option value="MOVIE">Movies</option>
              <option value="CONCERT">Concerts</option>
              <option value="EVENT">Special Events</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">From Date</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Filter
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => { setSearch(''); setEventType(''); setStartDate(''); }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Loading events...
        </div>
      ) : events.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: '16px' }}>No events found matching your criteria.</p>
          <button className="btn btn-outline btn-sm" onClick={() => { setSearch(''); setEventType(''); setStartDate(''); }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid-cards">
          {events.map((event) => {
            const isSoldOut = event.available_seats === 0;
            const minPrice = event.prices && event.prices.length > 0 ? Math.min(...event.prices.map((p) => Number(p.price))) : 0;

            return (
              <div key={event.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {getEventIcon(event.event_type)}
                      {event.event_type}
                    </span>
                    {isSoldOut ? (
                      <span className="badge badge-danger">SOLD OUT</span>
                    ) : (
                      <span className="badge badge-success">{event.available_seats} Seats Available</span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>{event.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '18px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {event.description}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={15} style={{ color: 'var(--primary)' }} />
                      <span>{new Date(event.event_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {event.start_time.slice(0, 5)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={15} style={{ color: 'var(--primary)' }} />
                      <span>{event.venue_name}, {event.venue_location}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Starts from</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>₹{minPrice.toFixed(0)}</div>
                  </div>

                  <Link to={`/events/${event.id}`} className="btn btn-primary btn-sm">
                    {isSoldOut ? 'Join Waitlist' : 'Select Seats'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
