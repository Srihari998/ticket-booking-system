const { getClient, query } = require('../db');
const { ConflictError, NotFoundError, ValidationError, ForbiddenError } = require('../utils/errors');
const { generateBookingReference } = require('../utils/tokens');
const { generateQRCodeDataURL } = require('./qrService');
const { sendBookingConfirmation } = require('./emailService');
const redisService = require('./redisService');
const { broadcastSeatUpdate } = require('../sockets');
const { processWaitlistQueue } = require('./waitlistService');

const createBooking = async ({ eventId, seatIds, userId }) => {
  if (!eventId || !Array.isArray(seatIds) || seatIds.length === 0 || !userId) {
    throw new ValidationError('eventId, seatIds, and userId are required');
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    const eventRes = await client.query(
      `SELECT e.id, e.title, e.event_date, e.start_time, e.status, v.name as venue_name, v.location as venue_location
       FROM events e
       JOIN venues v ON e.venue_id = v.id
       WHERE e.id = $1`,
      [eventId]
    );

    if (eventRes.rows.length === 0) {
      throw new NotFoundError('Event not found');
    }
    if (eventRes.rows[0].status !== 'PUBLISHED') {
      throw new ConflictError('Cannot book tickets for unpublished events');
    }
    const event = eventRes.rows[0];

    const userRes = await client.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      throw new NotFoundError('User not found');
    }
    const user = userRes.rows[0];

    const seatsQuery = `
      SELECT es.id, es.status, es.hold_user_id, es.hold_expires_at,
             vs.row_label, vs.seat_number, vs.category_id,
             sc.name as category_name,
             ecp.price as category_price
      FROM event_seats es
      JOIN venue_seats vs ON es.venue_seat_id = vs.id
      JOIN seat_categories sc ON vs.category_id = sc.id
      JOIN event_category_prices ecp ON (ecp.event_id = es.event_id AND ecp.category_id = vs.category_id)
      WHERE es.id = ANY($1) AND es.event_id = $2
      FOR UPDATE OF es
    `;
    const seatsRes = await client.query(seatsQuery, [seatIds, eventId]);

    if (seatsRes.rows.length !== seatIds.length) {
      throw new NotFoundError('One or more selected seats were not found for this event');
    }

    const now = new Date();
    for (const seat of seatsRes.rows) {
      if (seat.status !== 'HELD') {
        throw new ConflictError(`Seat ${seat.row_label}${seat.seat_number} is not held by you`);
      }
      if (seat.hold_user_id !== userId) {
        throw new ConflictError(`Seat ${seat.row_label}${seat.seat_number} is held by another user`);
      }
      if (seat.hold_expires_at && new Date(seat.hold_expires_at) <= now) {
        throw new ConflictError(`Hold for seat ${seat.row_label}${seat.seat_number} has expired`);
      }
    }

    let totalAmount = 0;
    seatsRes.rows.forEach((s) => {
      totalAmount += Number(s.category_price);
    });

    const bookingReference = generateBookingReference();

    const bookingInsertRes = await client.query(
      `INSERT INTO bookings (booking_reference, user_id, event_id, total_amount, status)
       VALUES ($1, $2, $3, $4, 'CONFIRMED')
       RETURNING id, booking_reference, total_amount, status, created_at`,
      [bookingReference, userId, eventId, totalAmount]
    );
    const bookingId = bookingInsertRes.rows[0].id;

    for (const seat of seatsRes.rows) {
      await client.query(
        `INSERT INTO booking_seats (booking_id, event_seat_id, price)
         VALUES ($1, $2, $3)`,
        [bookingId, seat.id, seat.category_price]
      );
    }

    await client.query(
      `UPDATE event_seats
       SET status = 'BOOKED', hold_user_id = NULL, hold_token = NULL, hold_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = ANY($1)`,
      [seatIds]
    );

    await client.query('COMMIT');

    for (const seatId of seatIds) {
      await redisService.del(`hold:event:${eventId}:seat:${seatId}`);
    }

    const qrDataUrl = await generateQRCodeDataURL(bookingReference);

    const broadcastPayload = seatsRes.rows.map((s) => ({
      id: s.id,
      eventId,
      rowLabel: s.row_label,
      seatNumber: s.seat_number,
      categoryId: s.category_id,
      categoryName: s.category_name,
      status: 'BOOKED',
      holdExpiresAt: null
    }));
    broadcastSeatUpdate(eventId, broadcastPayload);

    sendBookingConfirmation({
      toEmail: user.email,
      userName: user.name,
      bookingReference,
      eventTitle: event.title,
      eventDate: event.event_date,
      startTime: event.start_time,
      venueName: event.venue_name,
      seats: seatsRes.rows.map((s) => ({
        rowLabel: s.row_label,
        seatNumber: s.seat_number,
        categoryName: s.category_name
      })),
      totalAmount,
      qrDataUrl
    }).catch((e) => console.error('Error sending confirmation email:', e));

    return {
      bookingId,
      bookingReference,
      totalAmount,
      seatsCount: seatIds.length,
      qrDataUrl,
      seats: seatsRes.rows.map((s) => ({
        id: s.id,
        rowLabel: s.row_label,
        seatNumber: s.seat_number,
        categoryName: s.category_name,
        price: Number(s.category_price)
      }))
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const cancelBooking = async ({ bookingId, userId, userRole }) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const bookingRes = await client.query(
      `SELECT id, booking_reference, user_id, event_id, total_amount, status
       FROM bookings
       WHERE id = $1
       FOR UPDATE`,
      [bookingId]
    );

    if (bookingRes.rows.length === 0) {
      throw new NotFoundError('Booking not found');
    }

    const booking = bookingRes.rows[0];

    if (userRole !== 'ADMIN' && booking.user_id !== userId) {
      throw new ForbiddenError('You can only cancel your own bookings');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new ConflictError(`Cannot cancel a booking with status '${booking.status}'`);
    }

    const bookingSeatsRes = await client.query(
      `SELECT bs.id as booking_seat_id, bs.event_seat_id,
              es.id as seat_id, vs.row_label, vs.seat_number, vs.category_id, sc.name as category_name
       FROM booking_seats bs
       JOIN event_seats es ON bs.event_seat_id = es.id
       JOIN venue_seats vs ON es.venue_seat_id = vs.id
       JOIN seat_categories sc ON vs.category_id = sc.id
       WHERE bs.booking_id = $1
       FOR UPDATE OF es`,
      [bookingId]
    );

    await client.query(
      `UPDATE bookings
       SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [bookingId]
    );

    const seatIds = bookingSeatsRes.rows.map((s) => s.seat_id);

    await client.query(
      `UPDATE event_seats
       SET status = 'AVAILABLE', hold_user_id = NULL, hold_token = NULL, hold_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = ANY($1)`,
      [seatIds]
    );

    await client.query('COMMIT');

    const broadcastPayload = bookingSeatsRes.rows.map((s) => ({
      id: s.seat_id,
      eventId: booking.event_id,
      rowLabel: s.row_label,
      seatNumber: s.seat_number,
      categoryId: s.category_id,
      categoryName: s.category_name,
      status: 'AVAILABLE',
      holdExpiresAt: null
    }));
    broadcastSeatUpdate(booking.event_id, broadcastPayload);

    const categoriesAffected = [...new Set(bookingSeatsRes.rows.map((s) => s.category_id))];
    for (const catId of categoriesAffected) {
      processWaitlistQueue(booking.event_id, catId).catch((e) =>
        console.error('Error processing waitlist after cancellation:', e)
      );
    }

    return {
      bookingId,
      bookingReference: booking.booking_reference,
      status: 'CANCELLED',
      releasedSeatsCount: seatIds.length
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getUserBookings = async (userId) => {
  const bookingsRes = await query(
    `SELECT b.id, b.booking_reference, b.event_id, b.total_amount, b.status, b.created_at, b.cancelled_at,
            e.title as event_title, e.event_date, e.start_time, e.event_type,
            v.name as venue_name, v.location as venue_location
     FROM bookings b
     JOIN events e ON b.event_id = e.id
     JOIN venues v ON e.venue_id = v.id
     WHERE b.user_id = $1
     ORDER BY b.created_at DESC`,
    [userId]
  );

  const bookings = bookingsRes.rows;
  if (bookings.length === 0) return [];

  const bookingIds = bookings.map((b) => b.id);
  const seatsRes = await query(
    `SELECT bs.booking_id, bs.price, vs.row_label, vs.seat_number, sc.name as category_name
     FROM booking_seats bs
     JOIN event_seats es ON bs.event_seat_id = es.id
     JOIN venue_seats vs ON es.venue_seat_id = vs.id
     JOIN seat_categories sc ON vs.category_id = sc.id
     WHERE bs.booking_id = ANY($1)
     ORDER BY vs.row_label ASC, vs.seat_number ASC`,
    [bookingIds]
  );

  const seatsMap = {};
  seatsRes.rows.forEach((s) => {
    if (!seatsMap[s.booking_id]) seatsMap[s.booking_id] = [];
    seatsMap[s.booking_id].push({
      seat: `${s.row_label}${s.seat_number}`,
      rowLabel: s.row_label,
      seatNumber: s.seat_number,
      categoryName: s.category_name,
      price: Number(s.price)
    });
  });

  return bookings.map((b) => ({
    id: b.id,
    bookingReference: b.booking_reference,
    eventId: b.event_id,
    eventTitle: b.event_title,
    eventType: b.event_type,
    eventDate: b.event_date,
    startTime: b.start_time,
    venueName: b.venue_name,
    venueLocation: b.venue_location,
    totalAmount: Number(b.total_amount),
    status: b.status,
    createdAt: b.created_at,
    cancelledAt: b.cancelled_at,
    seats: seatsMap[b.id] || []
  }));
};

const getBookingById = async (bookingId, userId, userRole) => {
  const bookingRes = await query(
    `SELECT b.id, b.booking_reference, b.user_id, b.event_id, b.total_amount, b.status, b.created_at, b.cancelled_at,
            u.name as user_name, u.email as user_email,
            e.title as event_title, e.event_date, e.start_time, e.event_type,
            v.name as venue_name, v.location as venue_location
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     JOIN events e ON b.event_id = e.id
     JOIN venues v ON e.venue_id = v.id
     WHERE b.id = $1`,
    [bookingId]
  );

  if (bookingRes.rows.length === 0) {
    throw new NotFoundError('Booking not found');
  }

  const booking = bookingRes.rows[0];

  if (userRole !== 'ADMIN' && booking.user_id !== userId) {
    throw new ForbiddenError('You do not have permission to view this booking');
  }

  const seatsRes = await query(
    `SELECT bs.price, vs.row_label, vs.seat_number, sc.name as category_name
     FROM booking_seats bs
     JOIN event_seats es ON bs.event_seat_id = es.id
     JOIN venue_seats vs ON es.venue_seat_id = vs.id
     JOIN seat_categories sc ON vs.category_id = sc.id
     WHERE bs.booking_id = $1
     ORDER BY vs.row_label ASC, vs.seat_number ASC`,
    [bookingId]
  );

  const qrDataUrl = await generateQRCodeDataURL(booking.booking_reference);

  return {
    id: booking.id,
    bookingReference: booking.booking_reference,
    eventId: booking.event_id,
    eventTitle: booking.event_title,
    eventType: booking.event_type,
    eventDate: booking.event_date,
    startTime: booking.start_time,
    venueName: booking.venue_name,
    venueLocation: booking.venue_location,
    user: {
      id: booking.user_id,
      name: booking.user_name,
      email: booking.user_email
    },
    totalAmount: Number(booking.total_amount),
    status: booking.status,
    createdAt: booking.created_at,
    cancelledAt: booking.cancelled_at,
    qrDataUrl,
    seats: seatsRes.rows.map((s) => ({
      seat: `${s.row_label}${s.seat_number}`,
      rowLabel: s.row_label,
      seatNumber: s.seat_number,
      categoryName: s.category_name,
      price: Number(s.price)
    }))
  };
};

module.exports = {
  createBooking,
  cancelBooking,
  getUserBookings,
  getBookingById
};
