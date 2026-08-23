const { getClient, query } = require('../db');
const { ConflictError, NotFoundError, ValidationError } = require('../utils/errors');
const { generateHoldToken } = require('../utils/tokens');
const redisService = require('./redisService');
const { broadcastSeatUpdate } = require('../sockets');
const config = require('../config');

const holdSeats = async ({ eventId, seatIds, userId, ttlSeconds = config.seatHoldTtlSeconds }) => {
  if (!eventId || !Array.isArray(seatIds) || seatIds.length === 0) {
    throw new ValidationError('eventId and a non-empty array of seatIds are required');
  }

  const client = await getClient();
  const holdToken = generateHoldToken();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  try {
    await client.query('BEGIN');

    const eventResult = await client.query('SELECT id, status FROM events WHERE id = $1', [eventId]);
    if (eventResult.rows.length === 0) {
      throw new NotFoundError('Event not found');
    }
    if (eventResult.rows[0].status !== 'PUBLISHED') {
      throw new ConflictError('Cannot hold seats for unpublished or completed events');
    }

    const seatsQuery = `
      SELECT es.id, es.event_id, es.status, es.hold_user_id, es.hold_expires_at,
             vs.row_label, vs.seat_number, vs.category_id, sc.name as category_name
      FROM event_seats es
      JOIN venue_seats vs ON es.venue_seat_id = vs.id
      JOIN seat_categories sc ON vs.category_id = sc.id
      WHERE es.id = ANY($1) AND es.event_id = $2
      FOR UPDATE
    `;
    const seatsResult = await client.query(seatsQuery, [seatIds, eventId]);

    if (seatsResult.rows.length !== seatIds.length) {
      throw new NotFoundError('One or more selected seats were not found for this event');
    }

    const now = new Date();
    for (const seat of seatsResult.rows) {
      const isExpiredHold = seat.status === 'HELD' && seat.hold_expires_at && new Date(seat.hold_expires_at) <= now;
      const isAvailable = seat.status === 'AVAILABLE' || isExpiredHold;

      if (!isAvailable) {
        throw new ConflictError(`Seat ${seat.row_label}${seat.seat_number} is no longer available`);
      }
    }

    const updateQuery = `
      UPDATE event_seats
      SET status = 'HELD',
          hold_user_id = $1,
          hold_token = $2,
          hold_expires_at = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY($4)
      RETURNING id, event_id, status, hold_expires_at
    `;
    const updateResult = await client.query(updateQuery, [userId, holdToken, expiresAt, seatIds]);

    await client.query('COMMIT');

    for (const seatId of seatIds) {
      const redisKey = `hold:event:${eventId}:seat:${seatId}`;
      await redisService.setWithTTL(redisKey, { userId, holdToken, expiresAt }, ttlSeconds);
    }

    const broadcastPayload = seatsResult.rows.map((s) => ({
      id: s.id,
      eventId,
      rowLabel: s.row_label,
      seatNumber: s.seat_number,
      categoryId: s.category_id,
      categoryName: s.category_name,
      status: 'HELD',
      holdExpiresAt: expiresAt.toISOString()
    }));
    broadcastSeatUpdate(eventId, broadcastPayload);

    return {
      holdToken,
      expiresAt: expiresAt.toISOString(),
      heldSeatsCount: updateResult.rows.length,
      seatIds
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const releaseHold = async ({ eventId, seatIds, userId }) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const selectQuery = `
      SELECT es.id, es.event_id, es.status, es.hold_user_id,
             vs.row_label, vs.seat_number, vs.category_id, sc.name as category_name
      FROM event_seats es
      JOIN venue_seats vs ON es.venue_seat_id = vs.id
      JOIN seat_categories sc ON vs.category_id = sc.id
      WHERE es.id = ANY($1) AND es.event_id = $2
      FOR UPDATE
    `;
    const selectRes = await client.query(selectQuery, [seatIds, eventId]);

    const validSeatsToRelease = selectRes.rows.filter(
      (s) => s.status === 'HELD' && (userId === null || s.hold_user_id === userId)
    );

    if (validSeatsToRelease.length > 0) {
      const idsToRelease = validSeatsToRelease.map((s) => s.id);
      await client.query(
        `UPDATE event_seats
         SET status = 'AVAILABLE', hold_user_id = NULL, hold_token = NULL, hold_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = ANY($1)`,
        [idsToRelease]
      );

      for (const sId of idsToRelease) {
        await redisService.del(`hold:event:${eventId}:seat:${sId}`);
      }

      const broadcastPayload = validSeatsToRelease.map((s) => ({
        id: s.id,
        eventId,
        rowLabel: s.row_label,
        seatNumber: s.seat_number,
        categoryId: s.category_id,
        categoryName: s.category_name,
        status: 'AVAILABLE',
        holdExpiresAt: null
      }));
      broadcastSeatUpdate(eventId, broadcastPayload);
    }

    await client.query('COMMIT');
    return { releasedCount: validSeatsToRelease.length };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const cleanupExpiredHolds = async () => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const expiredQuery = `
      SELECT es.id, es.event_id, vs.row_label, vs.seat_number, vs.category_id, sc.name as category_name
      FROM event_seats es
      JOIN venue_seats vs ON es.venue_seat_id = vs.id
      JOIN seat_categories sc ON vs.category_id = sc.id
      WHERE es.status = 'HELD' AND es.hold_expires_at < CURRENT_TIMESTAMP
      FOR UPDATE
    `;
    const expiredRes = await client.query(expiredQuery);

    if (expiredRes.rows.length === 0) {
      await client.query('COMMIT');
      return [];
    }

    const expiredIds = expiredRes.rows.map((r) => r.id);
    await client.query(
      `UPDATE event_seats
       SET status = 'AVAILABLE', hold_user_id = NULL, hold_token = NULL, hold_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = ANY($1)`,
      [expiredIds]
    );

    await client.query('COMMIT');

    const byEvent = {};
    for (const seat of expiredRes.rows) {
      if (!byEvent[seat.event_id]) {
        byEvent[seat.event_id] = [];
      }
      byEvent[seat.event_id].push({
        id: seat.id,
        eventId: seat.event_id,
        rowLabel: seat.row_label,
        seatNumber: seat.seat_number,
        categoryId: seat.category_id,
        categoryName: seat.category_name,
        status: 'AVAILABLE',
        holdExpiresAt: null
      });
      await redisService.del(`hold:event:${seat.event_id}:seat:${seat.id}`);
    }

    for (const [evtId, seats] of Object.entries(byEvent)) {
      broadcastSeatUpdate(evtId, seats);
    }

    return expiredRes.rows;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during cleanupExpiredHolds:', error);
    return [];
  } finally {
    client.release();
  }
};

module.exports = {
  holdSeats,
  releaseHold,
  cleanupExpiredHolds
};
