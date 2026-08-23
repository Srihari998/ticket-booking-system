const { getClient, query } = require('../db');
const { ConflictError, NotFoundError, ValidationError, ForbiddenError } = require('../utils/errors');
const { generateOfferToken, generateBookingReference } = require('../utils/tokens');
const { generateQRCodeDataURL } = require('./qrService');
const { sendWaitlistOffer, sendBookingConfirmation } = require('./emailService');
const { broadcastSeatUpdate } = require('../sockets');
const config = require('../config');

const joinWaitlist = async ({ eventId, categoryId, userId, quantity = 1 }) => {
  if (!eventId || !categoryId || !userId) {
    throw new ValidationError('eventId, categoryId, and userId are required');
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const eventRes = await client.query('SELECT id, title, status FROM events WHERE id = $1', [eventId]);
    if (eventRes.rows.length === 0) {
      throw new NotFoundError('Event not found');
    }
    if (eventRes.rows[0].status !== 'PUBLISHED') {
      throw new ConflictError('Cannot join waitlist for unpublished events');
    }

    const catPriceRes = await client.query(
      'SELECT id FROM event_category_prices WHERE event_id = $1 AND category_id = $2',
      [eventId, categoryId]
    );
    if (catPriceRes.rows.length === 0) {
      throw new NotFoundError('Category not available for this event');
    }

    const existingWaitlistRes = await client.query(
      `SELECT id FROM waitlist_entries
       WHERE event_id = $1 AND category_id = $2 AND user_id = $3 AND status IN ('WAITING', 'OFFERED')`,
      [eventId, categoryId, userId]
    );
    if (existingWaitlistRes.rows.length > 0) {
      throw new ConflictError('You already have an active waitlist entry for this category');
    }

    const availableSeatsRes = await client.query(
      `SELECT COUNT(*)::int as count
       FROM event_seats es
       JOIN venue_seats vs ON es.venue_seat_id = vs.id
       WHERE es.event_id = $1 AND vs.category_id = $2 AND es.status = 'AVAILABLE'`,
      [eventId, categoryId]
    );

    if (availableSeatsRes.rows[0].count >= quantity) {
      throw new ConflictError('Seats are currently available in this category; you can book directly');
    }

    const insertRes = await client.query(
      `INSERT INTO waitlist_entries (event_id, user_id, category_id, quantity, status)
       VALUES ($1, $2, $3, $4, 'WAITING')
       RETURNING id, event_id, user_id, category_id, quantity, status, created_at`,
      [eventId, userId, categoryId, quantity]
    );

    const positionRes = await client.query(
      `SELECT COUNT(*)::int as position
       FROM waitlist_entries
       WHERE event_id = $1 AND category_id = $2 AND status = 'WAITING' AND created_at <= $3`,
      [eventId, categoryId, insertRes.rows[0].created_at]
    );

    await client.query('COMMIT');

    return {
      ...insertRes.rows[0],
      queuePosition: positionRes.rows[0].position
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const processWaitlistQueue = async (eventId, categoryId, externalClient = null) => {
  const client = externalClient || (await getClient());
  const shouldManageTransaction = !externalClient;

  try {
    if (shouldManageTransaction) {
      await client.query('BEGIN');
    }

    const waitingEntriesRes = await client.query(
      `SELECT we.id, we.event_id, we.user_id, we.category_id, we.quantity,
              u.name as user_name, u.email as user_email,
              e.title as event_title, sc.name as category_name
       FROM waitlist_entries we
       JOIN users u ON we.user_id = u.id
       JOIN events e ON we.event_id = e.id
       JOIN seat_categories sc ON we.category_id = sc.id
       WHERE we.event_id = $1 AND we.category_id = $2 AND we.status = 'WAITING'
       ORDER BY we.created_at ASC
       FOR UPDATE OF we`,
      [eventId, categoryId]
    );

    if (waitingEntriesRes.rows.length === 0) {
      if (shouldManageTransaction) await client.query('COMMIT');
      return null;
    }

    for (const entry of waitingEntriesRes.rows) {
      const availableSeatsRes = await client.query(
        `SELECT es.id, vs.row_label, vs.seat_number
         FROM event_seats es
         JOIN venue_seats vs ON es.venue_seat_id = vs.id
         WHERE es.event_id = $1 AND vs.category_id = $2 AND es.status = 'AVAILABLE'
         ORDER BY vs.row_label ASC, vs.seat_number ASC
         LIMIT $3
         FOR UPDATE OF es`,
        [eventId, categoryId, entry.quantity]
      );

      if (availableSeatsRes.rows.length < entry.quantity) {
        continue;
      }

      const allocatedSeatIds = availableSeatsRes.rows.map((s) => s.id);
      const token = generateOfferToken();
      const ttlSeconds = config.waitlistOfferTtlSeconds;
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      await client.query(
        `UPDATE event_seats
         SET status = 'HELD', hold_user_id = $1, hold_token = $2, hold_expires_at = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = ANY($4)`,
        [entry.user_id, token, expiresAt, allocatedSeatIds]
      );

      const offerRes = await client.query(
        `INSERT INTO waitlist_offers (waitlist_entry_id, token, expires_at, status)
         VALUES ($1, $2, $3, 'ACTIVE')
         RETURNING id, token, expires_at, status`,
        [entry.id, token, expiresAt]
      );

      for (const seatId of allocatedSeatIds) {
        await client.query(
          `INSERT INTO waitlist_offer_seats (offer_id, event_seat_id)
           VALUES ($1, $2)`,
          [offerRes.rows[0].id, seatId]
        );
      }

      await client.query(
        `UPDATE waitlist_entries SET status = 'OFFERED' WHERE id = $1`,
        [entry.id]
      );

      if (shouldManageTransaction) {
        await client.query('COMMIT');
      }

      const broadcastPayload = availableSeatsRes.rows.map((s) => ({
        id: s.id,
        eventId,
        rowLabel: s.row_label,
        seatNumber: s.seat_number,
        categoryId,
        categoryName: entry.category_name,
        status: 'HELD',
        holdExpiresAt: expiresAt.toISOString()
      }));
      broadcastSeatUpdate(eventId, broadcastPayload);

      sendWaitlistOffer({
        toEmail: entry.user_email,
        userName: entry.user_name,
        eventTitle: entry.event_title,
        categoryName: entry.category_name,
        offerUrl: `${config.clientUrl}/waitlist-offer/${token}`,
        expiresAt: expiresAt.toISOString(),
        quantity: entry.quantity
      }).catch((e) => console.error('Error sending waitlist offer email:', e));

      return {
        offerId: offerRes.rows[0].id,
        token,
        userId: entry.user_id,
        seatIds: allocatedSeatIds,
        expiresAt
      };
    }

    if (shouldManageTransaction) {
      await client.query('COMMIT');
    }
    return null;
  } catch (error) {
    if (shouldManageTransaction) {
      await client.query('ROLLBACK');
    }
    throw error;
  } finally {
    if (shouldManageTransaction) {
      client.release();
    }
  }
};

const getOfferByToken = async (token) => {
  const offerRes = await query(
    `SELECT wo.id, wo.token, wo.expires_at, wo.status,
            we.id as waitlist_entry_id, we.user_id, we.event_id, we.category_id, we.quantity,
            u.name as user_name, u.email as user_email,
            e.title as event_title, e.event_date, e.start_time, e.venue_id,
            v.name as venue_name, v.location as venue_location,
            sc.name as category_name, ecp.price as unit_price
     FROM waitlist_offers wo
     JOIN waitlist_entries we ON wo.waitlist_entry_id = we.id
     JOIN users u ON we.user_id = u.id
     JOIN events e ON we.event_id = e.id
     JOIN venues v ON e.venue_id = v.id
     JOIN seat_categories sc ON we.category_id = sc.id
     JOIN event_category_prices ecp ON (ecp.event_id = e.id AND ecp.category_id = sc.id)
     WHERE wo.token = $1`,
    [token]
  );

  if (offerRes.rows.length === 0) {
    throw new NotFoundError('Waitlist offer not found');
  }

  const offer = offerRes.rows[0];

  const now = new Date();
  if (offer.status === 'ACTIVE' && new Date(offer.expires_at) <= now) {
    await query(`UPDATE waitlist_offers SET status = 'EXPIRED' WHERE id = $1`, [offer.id]);
    offer.status = 'EXPIRED';
  }

  const seatsRes = await query(
    `SELECT es.id, vs.row_label, vs.seat_number, es.status
     FROM waitlist_offer_seats wos
     JOIN event_seats es ON wos.event_seat_id = es.id
     JOIN venue_seats vs ON es.venue_seat_id = vs.id
     WHERE wos.offer_id = $1`,
    [offer.id]
  );

  return {
    offerId: offer.id,
    token: offer.token,
    status: offer.status,
    expiresAt: offer.expires_at,
    isExpired: offer.status === 'EXPIRED' || new Date(offer.expires_at) <= now,
    user: {
      id: offer.user_id,
      name: offer.user_name,
      email: offer.user_email
    },
    event: {
      id: offer.event_id,
      title: offer.event_title,
      eventDate: offer.event_date,
      startTime: offer.start_time,
      venueName: offer.venue_name,
      venueLocation: offer.venue_location
    },
    category: {
      id: offer.category_id,
      name: offer.category_name,
      unitPrice: Number(offer.unit_price)
    },
    seats: seatsRes.rows.map((s) => ({
      id: s.id,
      rowLabel: s.row_label,
      seatNumber: s.seat_number,
      status: s.status
    })),
    totalAmount: Number(offer.unit_price) * seatsRes.rows.length
  };
};

const acceptWaitlistOffer = async ({ token, userId }) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const offerRes = await client.query(
      `SELECT wo.id, wo.token, wo.expires_at, wo.status, wo.waitlist_entry_id,
              we.user_id, we.event_id, we.category_id,
              u.name as user_name, u.email as user_email,
              e.title as event_title, e.event_date, e.start_time,
              v.name as venue_name,
              sc.name as category_name, ecp.price as unit_price
       FROM waitlist_offers wo
       JOIN waitlist_entries we ON wo.waitlist_entry_id = we.id
       JOIN users u ON we.user_id = u.id
       JOIN events e ON we.event_id = e.id
       JOIN venues v ON e.venue_id = v.id
       JOIN seat_categories sc ON we.category_id = sc.id
       JOIN event_category_prices ecp ON (ecp.event_id = e.id AND ecp.category_id = sc.id)
       WHERE wo.token = $1
       FOR UPDATE OF wo`,
      [token]
    );

    if (offerRes.rows.length === 0) {
      throw new NotFoundError('Waitlist offer not found');
    }

    const offer = offerRes.rows[0];

    if (offer.user_id !== userId) {
      throw new ForbiddenError('This offer does not belong to your account');
    }

    if (offer.status !== 'ACTIVE') {
      throw new ConflictError(`This offer is already ${offer.status.toLowerCase()}`);
    }

    const now = new Date();
    if (new Date(offer.expires_at) <= now) {
      await client.query(`UPDATE waitlist_offers SET status = 'EXPIRED' WHERE id = $1`, [offer.id]);
      await client.query(`UPDATE waitlist_entries SET status = 'EXPIRED' WHERE id = $1`, [offer.waitlist_entry_id]);
      await client.query('COMMIT');
      throw new ConflictError('This waitlist offer has expired');
    }

    const seatsRes = await client.query(
      `SELECT es.id, es.status, vs.row_label, vs.seat_number, vs.category_id
       FROM waitlist_offer_seats wos
       JOIN event_seats es ON wos.event_seat_id = es.id
       JOIN venue_seats vs ON es.venue_seat_id = vs.id
       WHERE wos.offer_id = $1
       FOR UPDATE OF es`,
      [offer.id]
    );

    const seatIds = seatsRes.rows.map((s) => s.id);
    const unitPrice = Number(offer.unit_price);
    const totalAmount = unitPrice * seatIds.length;
    const bookingReference = generateBookingReference();

    const bookingRes = await client.query(
      `INSERT INTO bookings (booking_reference, user_id, event_id, total_amount, status)
       VALUES ($1, $2, $3, $4, 'CONFIRMED')
       RETURNING id, booking_reference, total_amount, status, created_at`,
      [bookingReference, userId, offer.event_id, totalAmount]
    );

    const bookingId = bookingRes.rows[0].id;

    for (const s of seatsRes.rows) {
      await client.query(
        `INSERT INTO booking_seats (booking_id, event_seat_id, price)
         VALUES ($1, $2, $3)`,
        [bookingId, s.id, unitPrice]
      );
    }

    await client.query(
      `UPDATE event_seats
       SET status = 'BOOKED', hold_user_id = NULL, hold_token = NULL, hold_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = ANY($1)`,
      [seatIds]
    );

    await client.query(`UPDATE waitlist_offers SET status = 'ACCEPTED' WHERE id = $1`, [offer.id]);
    await client.query(`UPDATE waitlist_entries SET status = 'COMPLETED' WHERE id = $1`, [offer.waitlist_entry_id]);

    await client.query('COMMIT');

    const qrDataUrl = await generateQRCodeDataURL(bookingReference);

    const broadcastPayload = seatsRes.rows.map((s) => ({
      id: s.id,
      eventId: offer.event_id,
      rowLabel: s.row_label,
      seatNumber: s.seat_number,
      categoryId: s.category_id,
      categoryName: offer.category_name,
      status: 'BOOKED',
      holdExpiresAt: null
    }));
    broadcastSeatUpdate(offer.event_id, broadcastPayload);

    sendBookingConfirmation({
      toEmail: offer.user_email,
      userName: offer.user_name,
      bookingReference,
      eventTitle: offer.event_title,
      eventDate: offer.event_date,
      startTime: offer.start_time,
      venueName: offer.venue_name,
      seats: seatsRes.rows.map((s) => ({
        rowLabel: s.row_label,
        seatNumber: s.seat_number,
        categoryName: offer.category_name
      })),
      totalAmount,
      qrDataUrl
    }).catch((e) => console.error('Error sending confirmation email:', e));

    return {
      bookingId,
      bookingReference,
      totalAmount,
      seatsCount: seatIds.length,
      qrDataUrl
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const cleanupExpiredOffers = async () => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const expiredOffersRes = await client.query(
      `SELECT wo.id, wo.waitlist_entry_id, we.event_id, we.category_id, we.user_id,
              array_agg(wos.event_seat_id) as seat_ids
       FROM waitlist_offers wo
       JOIN waitlist_entries we ON wo.waitlist_entry_id = we.id
       JOIN waitlist_offer_seats wos ON wo.id = wos.offer_id
       WHERE wo.status = 'ACTIVE' AND wo.expires_at < CURRENT_TIMESTAMP
       GROUP BY wo.id, wo.waitlist_entry_id, we.event_id, we.category_id, we.user_id
       FOR UPDATE OF wo`
    );

    if (!expiredOffersRes.rows || expiredOffersRes.rows.length === 0) {
      await client.query('COMMIT');
      return [];
    }

    const expiredOfferIds = expiredOffersRes.rows.map((o) => o.id);
    const expiredEntryIds = expiredOffersRes.rows.map((o) => o.waitlist_entry_id);

    await client.query(`UPDATE waitlist_offers SET status = 'EXPIRED' WHERE id = ANY($1)`, [expiredOfferIds]);
    await client.query(`UPDATE waitlist_entries SET status = 'EXPIRED' WHERE id = ANY($1)`, [expiredEntryIds]);

    const allSeatIds = [];
    expiredOffersRes.rows.forEach((o) => allSeatIds.push(...o.seat_ids));

    if (allSeatIds.length > 0) {
      await client.query(
        `UPDATE event_seats
         SET status = 'AVAILABLE', hold_user_id = NULL, hold_token = NULL, hold_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = ANY($1) AND status = 'HELD'`,
        [allSeatIds]
      );
    }

    await client.query('COMMIT');

    for (const exp of expiredOffersRes.rows) {
      const seatsData = await query(
        `SELECT es.id, vs.row_label, vs.seat_number, vs.category_id, sc.name as category_name
         FROM event_seats es
         JOIN venue_seats vs ON es.venue_seat_id = vs.id
         JOIN seat_categories sc ON vs.category_id = sc.id
         WHERE es.id = ANY($1)`,
        [exp.seat_ids]
      );

      const broadcastPayload = seatsData.rows.map((s) => ({
        id: s.id,
        eventId: exp.event_id,
        rowLabel: s.row_label,
        seatNumber: s.seat_number,
        categoryId: s.category_id,
        categoryName: s.category_name,
        status: 'AVAILABLE',
        holdExpiresAt: null
      }));
      broadcastSeatUpdate(exp.event_id, broadcastPayload);

      processWaitlistQueue(exp.event_id, exp.category_id).catch((e) =>
        console.error('Error re-allocating waitlist after offer expiry:', e)
      );
    }

    return expiredOffersRes.rows;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during cleanupExpiredOffers:', error);
    return [];
  } finally {
    client.release();
  }
};

const getUserWaitlists = async (userId) => {
  const result = await query(
    `SELECT we.id, we.event_id, we.category_id, we.quantity, we.status, we.created_at,
            e.title as event_title, e.event_date, e.start_time,
            v.name as venue_name, sc.name as category_name,
            wo.token as active_offer_token, wo.expires_at as offer_expires_at, wo.status as offer_status
     FROM waitlist_entries we
     JOIN events e ON we.event_id = e.id
     JOIN venues v ON e.venue_id = v.id
     JOIN seat_categories sc ON we.category_id = sc.id
     LEFT JOIN waitlist_offers wo ON (wo.waitlist_entry_id = we.id AND wo.status = 'ACTIVE')
     WHERE we.user_id = $1
     ORDER BY we.created_at DESC`,
    [userId]
  );
  return result.rows;
};

const cancelWaitlistEntry = async (entryId, userId) => {
  const entryRes = await query(
    `SELECT id, status FROM waitlist_entries WHERE id = $1 AND user_id = $2`,
    [entryId, userId]
  );
  if (entryRes.rows.length === 0) {
    throw new NotFoundError('Waitlist entry not found');
  }
  if (!['WAITING', 'OFFERED'].includes(entryRes.rows[0].status)) {
    throw new ConflictError('Cannot cancel non-active waitlist entry');
  }

  await query(`UPDATE waitlist_entries SET status = 'CANCELLED' WHERE id = $1`, [entryId]);
  await query(`UPDATE waitlist_offers SET status = 'CANCELLED' WHERE waitlist_entry_id = $1 AND status = 'ACTIVE'`, [entryId]);

  return { success: true };
};

module.exports = {
  joinWaitlist,
  processWaitlistQueue,
  getOfferByToken,
  acceptWaitlistOffer,
  cleanupExpiredOffers,
  getUserWaitlists,
  cancelWaitlistEntry
};
