const request = require('supertest');
const app = require('../src/app');
const { query, closePool } = require('../src/db');
const { cleanupExpiredHolds } = require('../src/services/seatHoldService');
const { cleanupExpiredOffers, processWaitlistQueue } = require('../src/services/waitlistService');

describe('Ticket Booking System - Comprehensive Integration & Concurrency Test Suite', () => {
  let customerToken = '';
  let customer2Token = '';
  let organiserToken = '';
  let adminToken = '';

  const resetDbState = async () => {
    try {
      await query(`UPDATE event_seats SET status = 'AVAILABLE', hold_user_id = NULL, hold_token = NULL, hold_expires_at = NULL`);
      await query(`DELETE FROM booking_seats`);
      await query(`DELETE FROM bookings`);
      await query(`DELETE FROM waitlist_offer_seats`);
      await query(`DELETE FROM waitlist_offers`);
      await query(`DELETE FROM waitlist_entries`);
    } catch {}
  };

  beforeAll(async () => {
    await resetDbState();

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'Admin@123' });
    if (adminLogin.body?.data?.token) {
      adminToken = adminLogin.body.data.token;
    }

    const orgLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'organiser@example.com', password: 'Organiser@123' });
    if (orgLogin.body?.data?.token) {
      organiserToken = orgLogin.body.data.token;
    }

    const custLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer@example.com', password: 'Customer@123' });
    if (custLogin.body?.data?.token) {
      customerToken = custLogin.body.data.token;
    }

    const regCust2 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Customer Two', email: 'customer2@example.com', password: 'Customer@123', role: 'CUSTOMER' });
    if (regCust2.body?.data?.token) {
      customer2Token = regCust2.body.data.token;
    } else {
      const cust2Login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'customer2@example.com', password: 'Customer@123' });
      customer2Token = cust2Login.body.data.token;
    }
  });

  afterAll(async () => {
    await closePool();
  });

  beforeEach(async () => {
    await resetDbState();
  });

  test('1. Register and Login', async () => {
    const uniqueEmail = `user_${Date.now()}@example.com`;
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Brand New User', email: uniqueEmail, password: 'Password@123', role: 'CUSTOMER' });
    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.token).toBeDefined();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: uniqueEmail, password: 'Password@123' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.user.email).toBe(uniqueEmail);
  });

  test('2. Role Authorization Enforcement', async () => {
    const custCreateVenue = await request(app)
      .post('/api/venues')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Unauthorized Venue', location: 'Guntur', seats: [{ rowLabel: 'A', seatNumber: 1, categoryId: 1 }] });
    expect(custCreateVenue.status).toBe(403);

    const adminCreateVenue = await request(app)
      .post('/api/venues')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Test Venue ${Date.now()}`,
        location: 'Guntur Main',
        seats: [
          { rowLabel: 'A', seatNumber: 1, categoryId: 1 },
          { rowLabel: 'A', seatNumber: 2, categoryId: 2 }
        ]
      });
    expect(adminCreateVenue.status).toBe(201);
  });

  test('3. Create Event and Category Pricing', async () => {
    const createRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organiserToken}`)
      .send({
        title: `Test Movie ${Date.now()}`,
        description: 'Action movie',
        eventType: 'MOVIE',
        eventDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        startTime: '18:00:00',
        venueId: 1,
        categoryPrices: [
          { categoryId: 1, price: 295 },
          { categoryId: 2, price: 175 }
        ]
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.event.id).toBeDefined();
  });

  test('4. Fetch Seat Map with Real-Time Availability', async () => {
    const seatsRes = await request(app).get('/api/events/1/seats');
    expect(seatsRes.status).toBe(200);
    expect(Array.isArray(seatsRes.body.data.seats)).toBe(true);
    expect(seatsRes.body.data.seats.length).toBeGreaterThan(0);
    expect(seatsRes.body.data.seats[0].status).toBe('AVAILABLE');
  });

  test('5. Successful Seat Hold', async () => {
    const seatsRes = await request(app).get('/api/events/1/seats');
    const targetSeatId = seatsRes.body.data.seats[0].id;

    const holdRes = await request(app)
      .post('/api/events/1/holds')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ seatIds: [targetSeatId], ttlSeconds: 600 });
    expect(holdRes.status).toBe(201);
    expect(holdRes.body.data.holdToken).toBeDefined();
    expect(holdRes.body.data.seatIds).toContain(targetSeatId);

    const seatCheck = await request(app).get('/api/events/1/seats');
    const heldSeat = seatCheck.body.data.seats.find((s) => s.id === targetSeatId);
    expect(heldSeat.status).toBe('HELD');
  });

  test('6. Concurrent Seat Hold Contention (Exactly One Succeeds, Conflict 409)', async () => {
    const seatsRes = await request(app).get('/api/events/1/seats');
    const targetSeatId = seatsRes.body.data.seats[1].id;

    const requestA = request(app)
      .post('/api/events/1/holds')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ seatIds: [targetSeatId], ttlSeconds: 600 });

    const requestB = request(app)
      .post('/api/events/1/holds')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({ seatIds: [targetSeatId], ttlSeconds: 600 });

    const [resA, resB] = await Promise.all([requestA, requestB]);
    const statuses = [resA.status, resB.status];
    expect(statuses).toContain(201);
    expect(statuses).toContain(409);
  });

  test('7. Hold Auto-Expiry Release', async () => {
    const seatsRes = await request(app).get('/api/events/1/seats');
    const targetSeatId = seatsRes.body.data.seats[2].id;

    const holdRes = await request(app)
      .post('/api/events/1/holds')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ seatIds: [targetSeatId], ttlSeconds: 1 });
    expect(holdRes.status).toBe(201);

    await query(`UPDATE event_seats SET hold_expires_at = CURRENT_TIMESTAMP - INTERVAL '5 seconds' WHERE id = $1`, [targetSeatId]);

    await cleanupExpiredHolds();

    const checkRes = await request(app).get('/api/events/1/seats');
    const seat = checkRes.body.data.seats.find((s) => s.id === targetSeatId);
    expect(seat.status).toBe('AVAILABLE');
  });

  test('8. Booking Valid Held Seats and QR Code Generation', async () => {
    const seatsRes = await request(app).get('/api/events/1/seats');
    const targetSeatId = seatsRes.body.data.seats[3].id;

    await request(app)
      .post('/api/events/1/holds')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ seatIds: [targetSeatId], ttlSeconds: 600 });

    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ eventId: 1, seatIds: [targetSeatId] });
    expect(bookRes.status).toBe(201);
    expect(bookRes.body.data.bookingReference).toBeDefined();
    expect(bookRes.body.data.qrDataUrl).toMatch(/^data:image\/png;base64,/);

    const seatCheck = await request(app).get('/api/events/1/seats');
    const seat = seatCheck.body.data.seats.find((s) => s.id === targetSeatId);
    expect(seat.status).toBe('BOOKED');
  });

  test('9. Booking Expired Hold Rejection', async () => {
    const seatsRes = await request(app).get('/api/events/1/seats');
    const targetSeatId = seatsRes.body.data.seats[4].id;

    await request(app)
      .post('/api/events/1/holds')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ seatIds: [targetSeatId], ttlSeconds: 1 });

    await query(`UPDATE event_seats SET hold_expires_at = CURRENT_TIMESTAMP - INTERVAL '5 seconds' WHERE id = $1`, [targetSeatId]);

    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ eventId: 1, seatIds: [targetSeatId] });
    expect(bookRes.status).toBe(409);
    expect(bookRes.body.error.message).toContain('expired');
  });

  test('10. Booking Cancellation and Seat Release', async () => {
    const seatsRes = await request(app).get('/api/events/1/seats');
    const targetSeatId = seatsRes.body.data.seats[5].id;

    await request(app)
      .post('/api/events/1/holds')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ seatIds: [targetSeatId], ttlSeconds: 600 });

    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ eventId: 1, seatIds: [targetSeatId] });
    const bookingId = bookRes.body.data.bookingId;

    const cancelRes = await request(app)
      .post(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    const seatCheck = await request(app).get('/api/events/1/seats');
    const seat = seatCheck.body.data.seats.find((s) => s.id === targetSeatId);
    expect(seat.status).toBe('AVAILABLE');
  });

  test('11. Waitlist Registration for Sold-Out Category', async () => {
    await query(
      `UPDATE event_seats es
       SET status = 'BOOKED'
       FROM venue_seats vs
       WHERE es.venue_seat_id = vs.id AND es.event_id = 1 AND vs.category_id = 1`
    );

    const waitlistRes = await request(app)
      .post('/api/events/1/waitlist')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({ categoryId: 1, quantity: 1 });
    expect(waitlistRes.status).toBe(201);
    expect(waitlistRes.body.data.status).toBe('WAITING');
    expect(waitlistRes.body.data.queuePosition).toBe(1);
  });

  test('12. Automatic Waitlist Offer Generation on Booking Cancellation', async () => {
    await query(
      `UPDATE event_seats es
       SET status = 'BOOKED'
       FROM venue_seats vs
       WHERE es.venue_seat_id = vs.id AND es.event_id = 1 AND vs.category_id = 1`
    );

    await request(app)
      .post('/api/events/1/waitlist')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({ categoryId: 1, quantity: 1 });

    const seatRes = await query(
      `SELECT es.id FROM event_seats es
       JOIN venue_seats vs ON es.venue_seat_id = vs.id
       WHERE es.event_id = 1 AND vs.category_id = 1 LIMIT 1`
    );
    const bookedSeatId = seatRes.rows[0].id;

    const bookRes = await query(
      `INSERT INTO bookings (booking_reference, user_id, event_id, total_amount, status)
       VALUES ('BK-TEST-CANCEL', 3, 1, 295, 'CONFIRMED') RETURNING id`
    );
    const bookingId = bookRes.rows[0].id;

    await query(
      `INSERT INTO booking_seats (booking_id, event_seat_id, price)
       VALUES ($1, $2, 295)`,
      [bookingId, bookedSeatId]
    );

    const cancelRes = await request(app)
      .post(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(cancelRes.status).toBe(200);

    const user2Waitlist = await request(app)
      .get('/api/waitlist')
      .set('Authorization', `Bearer ${customer2Token}`);
    expect(user2Waitlist.body.data.waitlists.length).toBeGreaterThan(0);
    const offerToken = user2Waitlist.body.data.waitlists[0].active_offer_token;
    expect(offerToken).toBeDefined();
  });

  test('13. Waitlist Offer Acceptance and Ticket Generation', async () => {
    await query(
      `UPDATE event_seats es
       SET status = 'BOOKED'
       FROM venue_seats vs
       WHERE es.venue_seat_id = vs.id AND es.event_id = 1 AND vs.category_id = 1`
    );

    await request(app)
      .post('/api/events/1/waitlist')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({ categoryId: 1, quantity: 1 });

    const seatRes = await query(
      `SELECT es.id FROM event_seats es
       JOIN venue_seats vs ON es.venue_seat_id = vs.id
       WHERE es.event_id = 1 AND vs.category_id = 1 LIMIT 1`
    );
    await query(`UPDATE event_seats SET status = 'AVAILABLE' WHERE id = $1`, [seatRes.rows[0].id]);

    const offerResult = await processWaitlistQueue(1, 1);
    expect(offerResult).toBeDefined();

    const offerDetails = await request(app).get(`/api/waitlist-offers/${offerResult.token}`);
    expect(offerDetails.status).toBe(200);
    expect(offerDetails.body.data.offer.status).toBe('ACTIVE');

    const acceptRes = await request(app)
      .post(`/api/waitlist-offers/${offerResult.token}/accept`)
      .set('Authorization', `Bearer ${customer2Token}`);
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.bookingReference).toBeDefined();
    expect(acceptRes.body.data.qrDataUrl).toBeDefined();
  });

  test('14. Waitlist Offer Expiry and Progression to Next Customer', async () => {
    await query(
      `UPDATE event_seats es
       SET status = 'BOOKED'
       FROM venue_seats vs
       WHERE es.venue_seat_id = vs.id AND es.event_id = 1 AND vs.category_id = 1`
    );

    await request(app)
      .post('/api/events/1/waitlist')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({ categoryId: 1, quantity: 1 });

    const seatRes = await query(
      `SELECT es.id FROM event_seats es
       JOIN venue_seats vs ON es.venue_seat_id = vs.id
       WHERE es.event_id = 1 AND vs.category_id = 1 LIMIT 1`
    );
    await query(`UPDATE event_seats SET status = 'AVAILABLE' WHERE id = $1`, [seatRes.rows[0].id]);

    const offerResult = await processWaitlistQueue(1, 1);
    await query(`UPDATE waitlist_offers SET expires_at = CURRENT_TIMESTAMP - INTERVAL '5 seconds' WHERE token = $1`, [offerResult.token]);

    await cleanupExpiredOffers();

    const acceptExpired = await request(app)
      .post(`/api/waitlist-offers/${offerResult.token}/accept`)
      .set('Authorization', `Bearer ${customer2Token}`);
    expect(acceptExpired.status).toBe(409);
    expect(acceptExpired.body.error.message).toContain('expired');
  });

  test('15. Waitlist Re-Offer Chain: Expired Offer Re-Assigns Seat to Next In Queue', async () => {
    await query(
      `UPDATE event_seats es
       SET status = 'BOOKED'
       FROM venue_seats vs
       WHERE es.venue_seat_id = vs.id AND es.event_id = 1 AND vs.category_id = 1`
    );

    await request(app)
      .post('/api/events/1/waitlist')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ categoryId: 1, quantity: 1 });

    await request(app)
      .post('/api/events/1/waitlist')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({ categoryId: 1, quantity: 1 });

    const seatRes = await query(
      `SELECT es.id FROM event_seats es
       JOIN venue_seats vs ON es.venue_seat_id = vs.id
       WHERE es.event_id = 1 AND vs.category_id = 1 LIMIT 1`
    );
    await query(`UPDATE event_seats SET status = 'AVAILABLE' WHERE id = $1`, [seatRes.rows[0].id]);

    const offerResult1 = await processWaitlistQueue(1, 1);
    expect(offerResult1).toBeDefined();

    const user1Waitlists = await request(app)
      .get('/api/waitlist')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(user1Waitlists.body.data.waitlists[0].status).toBe('OFFERED');

    const user2WaitlistsBefore = await request(app)
      .get('/api/waitlist')
      .set('Authorization', `Bearer ${customer2Token}`);
    expect(user2WaitlistsBefore.body.data.waitlists[0].status).toBe('WAITING');

    await query(`UPDATE waitlist_offers SET expires_at = CURRENT_TIMESTAMP - INTERVAL '5 seconds' WHERE token = $1`, [offerResult1.token]);

    const cleanupRes = await cleanupExpiredOffers();
    expect(cleanupRes.length).toBeGreaterThan(0);

    const user1WaitlistsAfter = await request(app)
      .get('/api/waitlist')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(user1WaitlistsAfter.body.data.waitlists[0].status).toBe('EXPIRED');

    const user2WaitlistsAfter = await request(app)
      .get('/api/waitlist')
      .set('Authorization', `Bearer ${customer2Token}`);
    expect(user2WaitlistsAfter.body.data.waitlists[0].status).toBe('OFFERED');
    const newOfferToken = user2WaitlistsAfter.body.data.waitlists[0].active_offer_token;
    expect(newOfferToken).toBeDefined();
    expect(newOfferToken).not.toBe(offerResult1.token);

    const acceptRes2 = await request(app)
      .post(`/api/waitlist-offers/${newOfferToken}/accept`)
      .set('Authorization', `Bearer ${customer2Token}`);
    expect(acceptRes2.status).toBe(200);
    expect(acceptRes2.body.data.bookingReference).toBeDefined();
  });
});
