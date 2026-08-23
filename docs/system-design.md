# System Design: High-Concurrency Ticket Booking Engine

## 1. Executive Summary

This document details the engineering decisions behind the Ticket Booking System—focusing on seat inventory consistency under high contention, time-to-live (TTL) expiration guarantees, FIFO waitlist promotion, and zero double-booking architecture.

---

## 2. PostgreSQL as the Authoritative Source of Truth

In high-concurrency reservation platforms, relying on distributed in-memory caches as the primary transactional authority leads to state drift, race conditions during failover, and phantom bookings.

PostgreSQL acts as the single authoritative source of truth. Seat state transitions (`AVAILABLE` -> `HELD` -> `BOOKED`) are strictly enforced via relational constraints, unique indexes, and ACID transactions. Every state change is validated directly in the database before returning success to the client.

---

## 3. Concurrency Control & Row-Level Locking

When hundreds of concurrent customers contend for the exact same popular seat (e.g. A1 in a concert), optimistic concurrency or simple updates can lead to race conditions.

The system uses pessimistic row-level locking via `SELECT ... FOR UPDATE`:

1. A PostgreSQL transaction is opened (`BEGIN`).
2. The target seat rows are locked:
   ```sql
   SELECT id, status, hold_expires_at, hold_user_id
   FROM event_seats
   WHERE id = ANY($1) AND event_id = $2
   FOR UPDATE;
   ```
3. The engine verifies every requested seat is currently `AVAILABLE` (or has an expired hold where `hold_expires_at < NOW()`).
4. **All-or-Nothing Atomicity**: If any seat in a multi-seat batch is unavailable, the entire transaction rolls back immediately and returns HTTP `409 Conflict`.
5. The seats are updated to `HELD` with `hold_user_id`, a cryptographic `hold_token`, and `hold_expires_at = NOW() + INTERVAL '600 seconds'`.
6. Transaction commits (`COMMIT`), releasing the row locks.

This design guarantees that under simultaneous load, exactly one customer succeeds while all conflicting requests fail predictably with zero data corruption.

---

## 4. Role of Redis & Dual Expiration Protection

Redis is employed as a fast, sub-second coordination and caching layer:

- **Cache & Fast Check**: Key `hold:event:{eventId}:seat:{seatId}` is created with an `EX` TTL equal to `SEAT_HOLD_TTL_SECONDS` (default 600s).
- **Decoupled Fallback**: Even if Redis fails or restarts, PostgreSQL remains entirely authoritative because `event_seats.hold_expires_at` is always checked before booking confirmation.
- **Background Worker**: An asynchronous background job runs every 5 seconds executing:
  ```sql
  UPDATE event_seats
  SET status = 'AVAILABLE', hold_user_id = NULL, hold_token = NULL, hold_expires_at = NULL
  WHERE status = 'HELD' AND hold_expires_at < CURRENT_TIMESTAMP
  RETURNING id, event_id, venue_seat_id;
  ```
  Reclaimed seats are immediately broadcast to connected clients via WebSockets.

---

## 5. FIFO Waitlist & Time-Limited Booking Offers

When an event category is sold out, customers can join a strict First-In-First-Out (FIFO) queue stored in `waitlist_entries` ordered by `created_at ASC`.

### Allocation on Booking Cancellation:
1. When a confirmed booking is cancelled, its associated seats are unlocked and set to `AVAILABLE`.
2. A database transaction locks the FIFO queue (`SELECT ... FOR UPDATE OF we`) for the event and seat category.
3. The engine matches the first waiting entry needing `quantity` seats.
4. Matching available seats are held with a secure 256-bit unguessable random token (`crypto.randomBytes(32)`).
5. A record in `waitlist_offers` is created with an active window (`WAITLIST_OFFER_TTL_SECONDS`, default 10 minutes).
6. The customer receives a notification email with a direct claim link `/waitlist-offer/{token}`.
7. If the customer accepts before expiry, seats transition to `BOOKED` within a single transaction.
8. If the offer timer expires, the background worker marks the offer `EXPIRED` and automatically promotes the next eligible FIFO customer in line.

---

## 6. Real-Time Status Synchronization via Socket.IO

To prevent unnecessary server polling, real-time seat transitions are broadcast over Socket.IO rooms partitioned by `event:{eventId}`.

- When a customer navigates to `/events/:id`, the frontend joins room `event:{id}`.
- Upon any hold, release, booking, cancellation, or waitlist allocation, the server emits a `seatUpdated` event containing seat identifiers and new statuses.
- The React visual seat map dynamically updates individual seat colors (Green = Available, Indigo = Selected, Amber = Held, Grey = Booked) without requiring page reloads or full DOM re-renders.
