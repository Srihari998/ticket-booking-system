const { query, getClient } = require('../db');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { successResponse } = require('../utils/response');

const getVenues = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT v.id, v.name, v.location, v.created_by, v.created_at,
              COUNT(vs.id)::int as total_seats
       FROM venues v
       LEFT JOIN venue_seats vs ON v.id = vs.venue_id
       GROUP BY v.id
       ORDER BY v.id ASC`
    );
    return successResponse(res, { venues: result.rows });
  } catch (error) {
    next(error);
  }
};

const getVenueById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const venueRes = await query('SELECT * FROM venues WHERE id = $1', [id]);
    if (venueRes.rows.length === 0) {
      throw new NotFoundError('Venue not found');
    }

    const seatsRes = await query(
      `SELECT vs.id, vs.venue_id, vs.row_label, vs.seat_number, vs.category_id, sc.name as category_name
       FROM venue_seats vs
       JOIN seat_categories sc ON vs.category_id = sc.id
       WHERE vs.venue_id = $1
       ORDER BY vs.row_label ASC, vs.seat_number ASC`,
      [id]
    );

    return successResponse(res, {
      venue: venueRes.rows[0],
      seats: seatsRes.rows
    });
  } catch (error) {
    next(error);
  }
};

const createVenue = async (req, res, next) => {
  try {
    const { name, location } = req.body;
    if (!name || !location) {
      throw new ValidationError('Venue name and location are required');
    }

    const result = await query(
      `INSERT INTO venues (name, location, created_by)
       VALUES ($1, $2, $3)
       RETURNING id, name, location, created_by, created_at`,
      [name.trim(), location.trim(), req.user.id]
    );

    return successResponse(res, { venue: result.rows[0] }, 201);
  } catch (error) {
    next(error);
  }
};

const updateVenue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;

    const updates = [];
    const params = [id];
    let paramIdx = 2;

    if (name) {
      updates.push(`name = $${paramIdx++}`);
      params.push(name.trim());
    }
    if (location) {
      updates.push(`location = $${paramIdx++}`);
      params.push(location.trim());
    }

    if (updates.length === 0) {
      throw new ValidationError('At least name or location is required to update');
    }

    const result = await query(
      `UPDATE venues SET ${updates.join(', ')} WHERE id = $1 RETURNING id, name, location, created_by, created_at`,
      params
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Venue not found');
    }

    return successResponse(res, { venue: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const deleteVenue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM venues WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      throw new NotFoundError('Venue not found');
    }
    return successResponse(res, { message: 'Venue deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getVenueSeats = async (req, res, next) => {
  try {
    const { venueId } = req.params;
    const seatsRes = await query(
      `SELECT vs.id, vs.venue_id, vs.row_label, vs.seat_number, vs.category_id, sc.name as category_name
       FROM venue_seats vs
       JOIN seat_categories sc ON vs.category_id = sc.id
       WHERE vs.venue_id = $1
       ORDER BY vs.row_label ASC, vs.seat_number ASC`,
      [venueId]
    );

    return successResponse(res, { seats: seatsRes.rows });
  } catch (error) {
    next(error);
  }
};

const createVenueSeats = async (req, res, next) => {
  const client = await getClient();
  try {
    const { venueId } = req.params;
    const { seats } = req.body;

    if (!Array.isArray(seats) || seats.length === 0) {
      throw new ValidationError('An array of seat objects is required');
    }

    await client.query('BEGIN');

    const venueRes = await client.query('SELECT id FROM venues WHERE id = $1', [venueId]);
    if (venueRes.rows.length === 0) {
      throw new NotFoundError('Venue not found');
    }

    const insertedSeats = [];
    for (const seat of seats) {
      if (!seat.rowLabel || !seat.seatNumber || !seat.categoryId) {
        throw new ValidationError('Each seat must have rowLabel, seatNumber, and categoryId');
      }

      const seatRes = await client.query(
        `INSERT INTO venue_seats (venue_id, row_label, seat_number, category_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (venue_id, row_label, seat_number)
         DO UPDATE SET category_id = EXCLUDED.category_id
         RETURNING id, venue_id, row_label, seat_number, category_id`,
        [venueId, seat.rowLabel.toUpperCase(), seat.seatNumber, seat.categoryId]
      );
      insertedSeats.push(seatRes.rows[0]);
    }

    await client.query('COMMIT');

    return successResponse(res, { seats: insertedSeats }, 201);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

const getSeatCategories = async (req, res, next) => {
  try {
    const result = await query('SELECT id, name, description FROM seat_categories ORDER BY id ASC');
    return successResponse(res, { categories: result.rows });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
  getVenueSeats,
  createVenueSeats,
  getSeatCategories
};
