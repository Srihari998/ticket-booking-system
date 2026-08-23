const { query } = require('../db');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const { successResponse } = require('../utils/response');

const getOrganiserEvents = async (req, res, next) => {
  try {
    const isUserAdmin = req.user.role === 'ADMIN';
    const params = isUserAdmin ? [] : [req.user.id];
    const whereClause = isUserAdmin ? '' : 'WHERE e.organiser_id = $1';

    const sql = `
      SELECT e.id, e.title, e.event_type, e.event_date, e.start_time, e.status, e.created_at,
             v.name as venue_name, v.location as venue_location,
             COUNT(DISTINCT es.id)::int as total_seats,
             COUNT(DISTINCT CASE WHEN es.status = 'BOOKED' THEN es.id END)::int as booked_seats,
             COUNT(DISTINCT CASE WHEN es.status = 'HELD' THEN es.id END)::int as held_seats,
             COUNT(DISTINCT CASE WHEN es.status = 'AVAILABLE' THEN es.id END)::int as available_seats,
             COALESCE(SUM(CASE WHEN b.status = 'CONFIRMED' THEN bs.price ELSE 0 END), 0)::numeric as total_revenue,
             COUNT(DISTINCT CASE WHEN b.status = 'CONFIRMED' THEN b.id END)::int as total_bookings
      FROM events e
      JOIN venues v ON e.venue_id = v.id
      LEFT JOIN event_seats es ON e.id = es.event_id
      LEFT JOIN bookings b ON (e.id = b.event_id AND b.status = 'CONFIRMED')
      LEFT JOIN booking_seats bs ON (b.id = bs.booking_id AND es.id = bs.event_seat_id)
      ${whereClause}
      GROUP BY e.id, v.id
      ORDER BY e.event_date DESC, e.start_time DESC
    `;

    const result = await query(sql, params);

    const formatted = result.rows.map((row) => {
      const totalSeats = row.total_seats || 0;
      const bookedSeats = row.booked_seats || 0;
      const occupancy = totalSeats > 0 ? ((bookedSeats / totalSeats) * 100).toFixed(1) : '0.0';

      return {
        ...row,
        occupancyPercentage: parseFloat(occupancy),
        totalRevenue: Number(row.total_revenue)
      };
    });

    return successResponse(res, { events: formatted });
  } catch (error) {
    next(error);
  }
};

const getEventSummary = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const eventRes = await query(
      `SELECT e.id, e.title, e.description, e.event_type, e.event_date, e.start_time, e.status, e.organiser_id,
              v.name as venue_name, v.location as venue_location
       FROM events e
       JOIN venues v ON e.venue_id = v.id
       WHERE e.id = $1`,
      [eventId]
    );

    if (eventRes.rows.length === 0) {
      throw new NotFoundError('Event not found');
    }

    const event = eventRes.rows[0];
    if (req.user.role !== 'ADMIN' && event.organiser_id !== req.user.id) {
      throw new ForbiddenError('You can only view metrics for your own events');
    }

    const seatStatsRes = await query(
      `SELECT 
         COUNT(*)::int as total_seats,
         COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END)::int as available_seats,
         COUNT(CASE WHEN status = 'HELD' THEN 1 END)::int as held_seats,
         COUNT(CASE WHEN status = 'BOOKED' THEN 1 END)::int as booked_seats
       FROM event_seats
       WHERE event_id = $1`,
      [eventId]
    );

    const seatStats = seatStatsRes.rows[0];

    const categoryStatsRes = await query(
      `SELECT vs.category_id, sc.name as category_name, ecp.price,
              COUNT(*)::int as total_seats,
              COUNT(CASE WHEN es.status = 'BOOKED' THEN 1 END)::int as booked_seats,
              COUNT(CASE WHEN es.status = 'HELD' THEN 1 END)::int as held_seats,
              COUNT(CASE WHEN es.status = 'AVAILABLE' THEN 1 END)::int as available_seats,
              COALESCE(SUM(CASE WHEN es.status = 'BOOKED' THEN ecp.price ELSE 0 END), 0)::numeric as category_revenue
       FROM event_seats es
       JOIN venue_seats vs ON es.venue_seat_id = vs.id
       JOIN seat_categories sc ON vs.category_id = sc.id
       LEFT JOIN event_category_prices ecp ON (ecp.event_id = es.event_id AND ecp.category_id = vs.category_id)
       WHERE es.event_id = $1
       GROUP BY vs.category_id, sc.name, ecp.price`,
      [eventId]
    );

    const bookingsRes = await query(
      `SELECT b.id, b.booking_reference, b.total_amount, b.status, b.created_at,
              u.name as customer_name, u.email as customer_email,
              COUNT(bs.id)::int as seats_count
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN booking_seats bs ON b.id = bs.booking_id
       WHERE b.event_id = $1
       GROUP BY b.id, u.id
       ORDER BY b.created_at DESC`,
      [eventId]
    );

    const confirmedBookings = bookingsRes.rows.filter((b) => b.status === 'CONFIRMED');
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
    const totalSeats = seatStats.total_seats || 0;
    const bookedSeats = seatStats.booked_seats || 0;
    const occupancyPercentage = totalSeats > 0 ? ((bookedSeats / totalSeats) * 100).toFixed(1) : '0.0';

    const waitlistRes = await query(
      `SELECT COUNT(*)::int as waiting_count
       FROM waitlist_entries
       WHERE event_id = $1 AND status = 'WAITING'`,
      [eventId]
    );

    return successResponse(res, {
      event,
      summary: {
        totalSeats,
        bookedSeats,
        heldSeats: seatStats.held_seats || 0,
        availableSeats: seatStats.available_seats || 0,
        occupancyPercentage: parseFloat(occupancyPercentage),
        totalRevenue,
        bookingCount: confirmedBookings.length,
        waitlistCount: waitlistRes.rows[0].waiting_count || 0
      },
      categoryBreakdown: categoryStatsRes.rows.map((c) => ({
        ...c,
        price: Number(c.price || 0),
        categoryRevenue: Number(c.category_revenue || 0)
      })),
      recentBookings: bookingsRes.rows
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrganiserEvents,
  getEventSummary
};
