const request = require('supertest');
const app = require('../src/app');
const { mockDb } = require('../src/db');
const { cleanupExpiredHolds } = require('../src/services/seatHoldService');
const { cleanupExpiredOffers } = require('../src/services/waitlistService');

describe('Ticket Booking System - Comprehensive Integration & Concurrency Test Suite', () => {
  let customerToken = '';
  let customer2Token = '';
  let organiserToken = '';
  let adminToken = '';

  beforeAll(async () => {
    mockDb.reset();

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'Admin@123' });
    adminToken = adminLogin.body.data.token;

    const orgLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'organiser@example.com', password: 'Organiser@123' });
    organiserToken = orgLogin.body.data.token;

    const custLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer@example.com', password: 'Customer@123' });
    customerToken = custLogin.body.data.token;

    const cust2Login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer2@example.com', password: 'Customer@123' });
    customer2Token = cust2Login.body.data.token;
  });

  beforeEach(() => {
    mockDb.reset();
  });

  test('1. Register and Login', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Brand New User', email: 'brandnew@example.com', password: 'Password@123', role: 'CUSTOMER' });
    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.token).toBeDefined();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'brandnew@example.com', password: 'Password@123' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.user.email).toBe('brandnew@example.com');
  });

  test('2. Role Authorization Enforcement', async () => {
    const custCreateVenue = await request(app)
      .post('/api/venues')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Unauthorized Venue', location: 'Nowhere' });
    expect(custCreateVenue.status).toBe(403);

    const adminCreateVenue = await request(app)
      .post('/api/venues')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Authorized Admin Venue', location: 'City Center' });
    expect(adminCreateVenue.status).toBe(201);
    expect(adminCreateVenue.body.data.venue.name).toBe('Authorized Admin Venue');
  });

  test('3. Create Event and Category Pricing', async () => {
    const createRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organiserToken}`)
      .send({
        title: 'Summer Jazz Fest',
        description: 'Smooth jazz evening',
        eventType: 'CONCERT',
        eventDate: '2026-10-01',
        startTime: '18:00:00',
        venueId: 1,
        categoryPrices: [
          { categoryId: 1, price: 150.00 },
          { categoryId: 2, price: 80.00 }
        ]
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.event.title).toBe('Summer Jazz Fest');
  });

  test('4. Fetch Seat Map with Real-Time Availability', async () => {
    const seatsRes = await request(app)
      .get('/api/events/1/seats')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(seatsRes.status).toBe(200);
    expect(seatsRes.body.data.seats.length).toBeGreaterThan(0);
    expect(seatsRes.body.data.seats[0].status).toBe('AVAILABLE');
  });

  test('5. Successful Seat Hold', async () => {
    const holdRes = await request(app)
      .post('/api/events/1/holds')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ seatIds: [1, 2], ttlSeconds: 600 });
    expect(holdRes.status).toBe(201);
    expect(holdRes.body.data.holdToken).toBeDefined();
    expect(holdRes.body.data.heldSeatsCount).toBe(2);

    const seatCheck = await request(app).get('/api/events/1/seats');
    const heldSeats = seatCheck.body.data.seats.filter(s => [1, 2].includes(s.id));
    expect(heldSeats[0].status).toBe('HELD');
    expect(heldSeats[1].status).toBe('HELD');
  });

  test('6. Concurrent Seat Hold Contention (Exactly One Succeeds, Conflict 409)', async () => {
    const targetSeatId = 5;

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
    const holdRes = await request(app)
      .post('/api/events/1/holds')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ seatIds: [3], ttlSeconds: 1 });
    expect(holdRes.status).toBe(201);

    const targetSeat = mockDb.eventSeats.find(s => s.id === 3);
    targetSeat.hold_expires_at = new Date(Date.now() - 5000);

    await cleanupExpiredHolds();

    const checkRes = await request(app).get('/api/events/1/seats');
    const seat3 = checkRes.body.data.seats.find(s => s.id === 3);
    expect(seat3.status).toBe('AVAILABLE');
  });

  test('8. Booking Valid Held Seats and QR Code Generation', async () => {
    const holdRes = await request(app)
      .post('/api/events/1/holds')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ seatIds: [4], ttlSeconds: 600 });
    expect(holdRes.status).toBe(201);

    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ eventId: 1, seatIds: [4] });
    expect(bookRes.status).toBe(201);
    expect(bookRes.body.data.bookingReference).toBeDefined();
    expect(bookRes.body.data.qrDataUrl).toMatch(/^data:image\/png;base64,/);

    const seatCheck = await request(app).get('/api/events/1/seats');
    const seat4 = seatCheck.body.data.seats.find(s => s.id === 4);
    expect(seat4.status).toBe('BOOKED');
  });

  test('9. Booking Expired Hold Rejection', async () => {
    await request(app)
      .post('/api/events/1/holds')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ seatIds: [6], ttlSeconds: 1 });

    const targetSeat = mockDb.eventSeats.find(s => s.id === 6);
    targetSeat.hold_expires_at = new Date(Date.now() - 5000);

    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ eventId: 1, seatIds: [6] });
    expect(bookRes.status).toBe(409);
    expect(bookRes.body.error.message).toContain('expired');
  });

  test('10. Booking Cancellation and Seat Release', async () => {
    await request(app)
      .post('/api/events/1/holds')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ seatIds: [7], ttlSeconds: 600 });

    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ eventId: 1, seatIds: [7] });
    const bookingId = bookRes.body.data.bookingId;

    const cancelRes = await request(app)
      .post(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    const seatCheck = await request(app).get('/api/events/1/seats');
    const seat7 = seatCheck.body.data.seats.find(s => s.id === 7);
    expect(seat7.status).toBe('AVAILABLE');
  });

  test('11. Waitlist Registration for Sold-Out Category', async () => {
    const premiumSeats = mockDb.eventSeats.filter(es => {
      const vs = mockDb.venueSeats.find(v => v.id === es.venue_seat_id);
      return es.event_id === 1 && vs && vs.category_id === 1;
    });
    premiumSeats.forEach(s => { s.status = 'BOOKED'; });

    const waitlistRes = await request(app)
      .post('/api/events/1/waitlist')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({ categoryId: 1, quantity: 1 });
    expect(waitlistRes.status).toBe(201);
    expect(waitlistRes.body.data.status).toBe('WAITING');
    expect(waitlistRes.body.data.queuePosition).toBe(1);
  });

  test('12. Automatic Waitlist Offer Generation on Booking Cancellation', async () => {
    const premiumSeats = mockDb.eventSeats.filter(es => {
      const vs = mockDb.venueSeats.find(v => v.id === es.venue_seat_id);
      return es.event_id === 1 && vs && vs.category_id === 1;
    });
    premiumSeats.forEach(s => { s.status = 'BOOKED'; });

    await request(app)
      .post('/api/events/1/waitlist')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({ categoryId: 1, quantity: 1 });

    const bookedSeat = premiumSeats[0];
    const booking = {
      id: 99,
      booking_reference: 'BK-TEST-CANCEL',
      user_id: 3,
      event_id: 1,
      total_amount: 120,
      status: 'CONFIRMED',
      created_at: new Date()
    };
    mockDb.bookings.push(booking);
    mockDb.bookingSeats.push({
      id: 99,
      booking_id: 99,
      event_seat_id: bookedSeat.id,
      price: 120
    });

    const cancelRes = await request(app)
      .post('/api/bookings/99/cancel')
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
    const premiumSeats = mockDb.eventSeats.filter(es => {
      const vs = mockDb.venueSeats.find(v => v.id === es.venue_seat_id);
      return es.event_id === 1 && vs && vs.category_id === 1;
    });
    premiumSeats.forEach(s => { s.status = 'BOOKED'; });

    await request(app)
      .post('/api/events/1/waitlist')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({ categoryId: 1, quantity: 1 });

    premiumSeats[0].status = 'AVAILABLE';
    const { processWaitlistQueue } = require('../src/services/waitlistService');
    const offerResult = await processWaitlistQueue(1, 1);
    expect(offerResult).toBeDefined();

    const offerDetails = await request(app)
      .get(`/api/waitlist-offers/${offerResult.token}`);
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
    const premiumSeats = mockDb.eventSeats.filter(es => {
      const vs = mockDb.venueSeats.find(v => v.id === es.venue_seat_id);
      return es.event_id === 1 && vs && vs.category_id === 1;
    });
    premiumSeats.forEach(s => { s.status = 'BOOKED'; });

    await request(app)
      .post('/api/events/1/waitlist')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({ categoryId: 1, quantity: 1 });

    premiumSeats[0].status = 'AVAILABLE';
    const { processWaitlistQueue } = require('../src/services/waitlistService');
    const offerResult = await processWaitlistQueue(1, 1);

    const targetOffer = mockDb.waitlistOffers.find(o => o.token === offerResult.token);
    targetOffer.expires_at = new Date(Date.now() - 5000);

    await cleanupExpiredOffers();

    const acceptExpired = await request(app)
      .post(`/api/waitlist-offers/${offerResult.token}/accept`)
      .set('Authorization', `Bearer ${customer2Token}`);
    expect(acceptExpired.status).toBe(409);
    expect(acceptExpired.body.error.message).toContain('expired');
  });
});
