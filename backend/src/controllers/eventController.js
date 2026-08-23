const { query, getClient } = require('../db');
const { NotFoundError, ValidationError, ForbiddenError } = require('../utils/errors');
const { successResponse } = require('../utils/response');

const getEvents = async (req, res, next) => {
  try {
    const { search, eventType, startDate, endDate, venueId, status } = req.query;

    let sql = `
      SELECT e.id, e.title, e.description, e.event_type, e.event_date, e.start_time, e.status, e.created_at,
             v.id as venue_id, v.name as venue_name, v.location as venue_location,
             u.id as organiser_id, u.name as organiser_name,
             COALESCE(
               json_agg(
                 json_build_object('categoryId', ecp.category_id, 'categoryName', sc.name, 'price', ecp.price)
               ) FILTER (WHERE ecp.id IS NOT NULL), '[]'
             ) as prices,
             (
               SELECT COUNT(*)::int FROM event_seats es WHERE es.event_id = e.id
             ) as total_seats,
             (
               SELECT COUNT(*)::int FROM event_seats es WHERE es.event_id = e.id AND es.status = 'AVAILABLE'
             ) as available_seats
      FROM events e
      JOIN venues v ON e.venue_id = v.id
      JOIN users u ON e.organiser_id = u.id
      LEFT JOIN event_category_prices ecp ON e.id = ecp.event_id
      LEFT JOIN seat_categories sc ON ecp.category_id = sc.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      sql += ` AND e.status = $${paramIndex++}`;
      params.push(status);
    } else {
      sql += ` AND e.status = 'PUBLISHED'`;
    }

    if (search) {
      sql += ` AND (e.title ILIKE $${paramIndex} OR e.description ILIKE $${paramIndex} OR v.name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (eventType) {
      sql += ` AND e.event_type = $${paramIndex++}`;
      params.push(eventType.toUpperCase());
    }

    if (venueId) {
      sql += ` AND e.venue_id = $${paramIndex++}`;
      params.push(venueId);
    }

    if (startDate) {
      sql += ` AND e.event_date >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND e.event_date <= $${paramIndex++}`;
      params.push(endDate);
    }

    sql += ` GROUP BY e.id, v.id, u.id ORDER BY e.event_date ASC, e.start_time ASC`;

    const result = await query(sql, params);
    return successResponse(res, { events: result.rows });
  } catch (error) {
    next(error);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const eventResult = await query(
      `SELECT e.id, e.title, e.description, e.event_type, e.event_date, e.start_time, e.status, e.created_at,
              v.id as venue_id, v.name as venue_name, v.location as venue_location,
              u.id as organiser_id, u.name as organiser_name
       FROM events e
       JOIN venues v ON e.venue_id = v.id
       JOIN users u ON e.organiser_id = u.id
       WHERE e.id = $1`,
      [id]
    );

    if (eventResult.rows.length === 0) {
      throw new NotFoundError('Event not found');
    }

    const event = eventResult.rows[0];

    const pricesResult = await query(
      `SELECT ecp.category_id, sc.name as category_name, sc.description as category_description, ecp.price
       FROM event_category_prices ecp
       JOIN seat_categories sc ON ecp.category_id = sc.id
       WHERE ecp.event_id = $1
       ORDER BY ecp.price DESC`,
      [id]
    );

    const statsResult = await query(
      `SELECT 
         COUNT(*)::int as total_seats,
         COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END)::int as available_seats,
         COUNT(CASE WHEN status = 'HELD' THEN 1 END)::int as held_seats,
         COUNT(CASE WHEN status = 'BOOKED' THEN 1 END)::int as booked_seats
       FROM event_seats
       WHERE event_id = $1`,
      [id]
    );

    const categoryStatsResult = await query(
      `SELECT vs.category_id, sc.name as category_name,
              COUNT(*)::int as total,
              COUNT(CASE WHEN es.status = 'AVAILABLE' THEN 1 END)::int as available,
              COUNT(CASE WHEN es.status = 'HELD' THEN 1 END)::int as held,
              COUNT(CASE WHEN es.status = 'BOOKED' THEN 1 END)::int as booked
       FROM event_seats es
       JOIN venue_seats vs ON es.venue_seat_id = vs.id
       JOIN seat_categories sc ON vs.category_id = sc.id
       WHERE es.event_id = $1
       GROUP BY vs.category_id, sc.name`,
      [id]
    );

    return successResponse(res, {
      event,
      pricing: pricesResult.rows,
      stats: statsResult.rows[0] || { total_seats: 0, available_seats: 0, held_seats: 0, booked_seats: 0 },
      categoryStats: categoryStatsResult.rows
    });
  } catch (error) {
    next(error);
  }
};

const getEventSeats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user ? req.user.id : null;

    const eventResult = await query('SELECT id, status FROM events WHERE id = $1', [id]);
    if (eventResult.rows.length === 0) {
      throw new NotFoundError('Event not found');
    }

    const seatsResult = await query(
      `SELECT es.id, es.event_id, es.venue_seat_id, es.status, es.hold_expires_at, es.hold_user_id,
              vs.row_label, vs.seat_number, vs.category_id,
              sc.name as category_name,
              ecp.price
       FROM event_seats es
       JOIN venue_seats vs ON es.venue_seat_id = vs.id
       JOIN seat_categories sc ON vs.category_id = sc.id
       LEFT JOIN event_category_prices ecp ON (ecp.event_id = es.event_id AND ecp.category_id = vs.category_id)
       WHERE es.event_id = $1
       ORDER BY vs.row_label ASC, vs.seat_number ASC`,
      [id]
    );

    const now = new Date();
    const formattedSeats = seatsResult.rows.map((s) => {
      let currentStatus = s.status;
      if (currentStatus === 'HELD' && s.hold_expires_at && new Date(s.hold_expires_at) <= now) {
        currentStatus = 'AVAILABLE';
      }

      const isMyHold = currentUserId && s.hold_user_id === currentUserId && currentStatus === 'HELD';

      return {
        id: s.id,
        venueSeatId: s.venue_seat_id,
        rowLabel: s.row_label,
        seatNumber: s.seat_number,
        categoryId: s.category_id,
        categoryName: s.category_name,
        price: Number(s.price || 0),
        status: currentStatus,
        isMyHold: Boolean(isMyHold),
        holdExpiresAt: isMyHold ? s.hold_expires_at : null
      };
    });

    return successResponse(res, { seats: formattedSeats });
  } catch (error) {
    next(error);
  }
};

const createEvent = async (req, res, next) => {
  const client = await getClient();

  try {
    const { title, description, eventType, eventDate, startTime, venueId, categoryPrices } = req.body;

    if (!title || !eventType || !eventDate || !startTime || !venueId) {
      throw new ValidationError('title, eventType, eventDate, startTime, and venueId are required');
    }

    if (!Array.isArray(categoryPrices) || categoryPrices.length === 0) {
      throw new ValidationError('categoryPrices array with categoryId and price is required');
    }

    await client.query('BEGIN');

    const venueRes = await client.query('SELECT id FROM venues WHERE id = $1', [venueId]);
    if (venueRes.rows.length === 0) {
      throw new NotFoundError('Venue not found');
    }

    const eventInsertRes = await client.query(
      `INSERT INTO events (organiser_id, venue_id, title, description, event_type, event_date, start_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PUBLISHED')
       RETURNING id, organiser_id, venue_id, title, description, event_type, event_date, start_time, status, created_at`,
      [req.user.id, venueId, title.trim(), description || '', eventType.toUpperCase(), eventDate, startTime]
    );
    const event = eventInsertRes.rows[0];

    for (const cp of categoryPrices) {
      await client.query(
        `INSERT INTO event_category_prices (event_id, category_id, price)
         VALUES ($1, $2, $3)
         ON CONFLICT (event_id, category_id) DO UPDATE SET price = EXCLUDED.price`,
        [event.id, cp.categoryId, cp.price]
      );
    }

    await client.query(
      `INSERT INTO event_seats (event_id, venue_seat_id, status)
       SELECT $1, vs.id, 'AVAILABLE'
       FROM venue_seats vs
       WHERE vs.venue_id = $2
       ON CONFLICT (event_id, venue_seat_id) DO NOTHING`,
      [event.id, venueId]
    );

    await client.query('COMMIT');

    return successResponse(res, { event }, 201);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

const updateEvent = async (req, res, next) => {
  const client = await getClient();
  try {
    const { id } = req.params;
    const { title, description, eventType, eventDate, startTime, venueId, status, categoryPrices } = req.body;

    await client.query('BEGIN');

    const eventRes = await client.query('SELECT organiser_id, venue_id FROM events WHERE id = $1', [id]);
    if (eventRes.rows.length === 0) {
      throw new NotFoundError('Event not found');
    }

    if (req.user.role !== 'ADMIN' && eventRes.rows[0].organiser_id !== req.user.id) {
      throw new ForbiddenError('You can only update your own events');
    }

    const updates = [];
    const params = [id];
    let paramIdx = 2;

    if (title !== undefined) {
      updates.push(`title = $${paramIdx++}`);
      params.push(title.trim());
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIdx++}`);
      params.push(description);
    }
    if (eventType !== undefined) {
      updates.push(`event_type = $${paramIdx++}`);
      params.push(eventType.toUpperCase());
    }
    if (eventDate !== undefined) {
      updates.push(`event_date = $${paramIdx++}`);
      params.push(eventDate);
    }
    if (startTime !== undefined) {
      updates.push(`start_time = $${paramIdx++}`);
      params.push(startTime);
    }
    if (venueId !== undefined) {
      updates.push(`venue_id = $${paramIdx++}`);
      params.push(venueId);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIdx++}`);
      params.push(status);
    }

    if (updates.length > 0) {
      await client.query(`UPDATE events SET ${updates.join(', ')} WHERE id = $1`, params);
    }

    if (venueId !== undefined) {
      await client.query(
        `INSERT INTO event_seats (event_id, venue_seat_id, status)
         SELECT $1, vs.id, 'AVAILABLE'
         FROM venue_seats vs
         WHERE vs.venue_id = $2
         ON CONFLICT (event_id, venue_seat_id) DO NOTHING`,
        [id, venueId]
      );
    }

    if (Array.isArray(categoryPrices)) {
      for (const cp of categoryPrices) {
        await client.query(
          `INSERT INTO event_category_prices (event_id, category_id, price)
           VALUES ($1, $2, $3)
           ON CONFLICT (event_id, category_id) DO UPDATE SET price = EXCLUDED.price`,
          [id, cp.categoryId, cp.price]
        );
      }
    }

    await client.query('COMMIT');

    return successResponse(res, { message: 'Event updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eventRes = await query('SELECT organiser_id FROM events WHERE id = $1', [id]);
    if (eventRes.rows.length === 0) {
      throw new NotFoundError('Event not found');
    }

    if (req.user.role !== 'ADMIN' && eventRes.rows[0].organiser_id !== req.user.id) {
      throw new ForbiddenError('You can only cancel your own events');
    }

    await query(`UPDATE events SET status = 'CANCELLED' WHERE id = $1`, [id]);
    return successResponse(res, { message: 'Event cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  getEventById,
  getEventSeats,
  createEvent,
  updateEvent,
  deleteEvent
};
