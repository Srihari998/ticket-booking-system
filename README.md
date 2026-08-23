# TicketEase - Production-Ready Modular Monolith Ticket Booking Platform

TicketEase is a full-stack ticket booking platform for movies, concerts, and live performances. It is built as a modular monolith prioritizing seat concurrency correctness, database transactions with row-level locks, Redis TTL coordination, FIFO waitlist allocation, QR code ticket generation, and real-time Socket.IO synchronization.

---

## 🌐 Live Demo & Deployment

| Resource | URL |
|---|---|
| **Deployed Frontend (Vercel)** | `https://ticket-booking-system-tawny.vercel.app/` |
| **Backend API Gateway (Render)** | `https://ticket-booking-system-3el9.onrender.com/api` |
| **API Health Endpoint** | `https://ticket-booking-system-3el9.onrender.com/api/health` |

> **Note on Demo Credentials**: Production database migrations and seed scripts have been executed. All demo accounts below are pre-seeded and ready to use live immediately:
> - **Customer**: `customer@example.com` / `Customer@123`
> - **Organiser**: `organiser@example.com` / `Organiser@123`
> - **Admin**: `admin@example.com` / `Admin@123`

---

## 1. Features

### Customer Experience
- **Authentication & RBAC**: Secure registration and login using bcrypt password hashing and JWT authorization.
- **Event Discovery**: Search and filter by event category (`MOVIE`, `CONCERT`, `EVENT`), venue, and date range.
- **Interactive Visual Seat Map**: Real-time seat grid distinguishing `AVAILABLE` (Premium & Standard), `HELD`, `BOOKED`, and `SELECTED`.
- **ACID Seat Holds with Live Countdowns**: Configurable hold TTL (default 10 minutes) with auto-expiry.
- **Instant Booking & QR Tickets**: Atomic booking confirmation generating unique references (e.g. `BK-20260823-AB12CD`) and scannable QR ticket passes.
- **Email Notifications**: Confirmation emails with embedded QR tickets (gracefully falls back to formatted console logging if SMTP is unconfigured).
- **Booking Management & Cancellation**: View booking history and cancel bookings with automatic seat release.
- **FIFO Waitlists & Time-Limited Offers**: Join waitlists for sold-out seat categories; receive single-use cryptographic offer tokens when seats become available with live 10-minute claim windows.

### Organiser Dashboard
- **Listing Creation**: Set venue, date, time, and multi-category pricing (Premium/Standard).
- **Revenue Analytics**: Real-time dashboard showing total revenue, sold seats, available inventory, occupancy percentage, and FIFO waitlist count.

### Admin Portal
- **Venue & Layout Management**: Create and configure physical seat layouts across custom rows and categories.

---

## 2. Tech Stack

- **Frontend**: React 18, Vite, React Router v7, Axios, Socket.IO Client, Lucide React, Modern CSS System.
- **Backend**: Node.js, Express, Socket.IO, JWT, bcryptjs, PostgreSQL driver (`pg`), Redis client (`ioredis`), Nodemailer, QRCode.
- **Database**: PostgreSQL (Authoritative Source of Truth).
- **In-Memory / TTL**: Redis (with memory fallback for standalone development).
- **Testing**: Jest, Supertest.

---

## 3. Project Structure

```
ticket-booking-system/
├── backend/
│   ├── src/
│   │   ├── config/             # Environment, TTL, and SMTP settings
│   │   ├── controllers/        # REST API controllers
│   │   ├── db/                 # Postgres connection pool, migrations, seeds, mock adapter
│   │   ├── jobs/               # Background expiration workers
│   │   ├── middleware/         # JWT auth, role authorization, error handling
│   │   ├── routes/             # Partitioned API route definitions
│   │   ├── services/           # SeatHold, Booking, Waitlist, QR, Email, Redis
│   │   ├── sockets/            # Socket.IO rooms and real-time emitters
│   │   ├── utils/              # Token generators, errors, response formatters
│   │   ├── app.js              # Express app setup
│   │   └── server.js           # Server entry point
│   ├── tests/                  # Integration and concurrency test suite
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/         # SeatMap, CountdownTimer, Navbar, ProtectedRoute
│   │   ├── context/            # AuthContext, SocketContext
│   │   ├── hooks/              # useCountdown
│   │   ├── pages/              # Events, Detail, Checkout, Bookings, Waitlist, Admin, Organiser
│   │   ├── services/           # Axios API services
│   │   ├── styles/             # Responsive design system
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── database/
│   ├── schema.sql              # Clean DDL with indexes and constraints
│   └── seed.sql                # Seed data for venues, users, events, and seat layouts
├── docs/
│   ├── architecture.md         # Modular monolith diagrams and data flows
│   ├── system-design.md        # Technical interview-ready writeup (<800 words)
│   └── api.md                  # REST API reference
├── README.md
└── .gitignore
```

---

## 4. Concurrency Prevention & Seat Hold Mechanism

```mermaid
sequenceDiagram
    autonumber
    actor Customer A
    actor Customer B
    participant API as Backend Service
    participant DB as PostgreSQL (Authoritative)
    participant Redis as Redis Cache
    participant WS as Socket.IO Clients

    Customer A->>API: Request hold on Seat A1
    Customer B->>API: Request hold on Seat A1 (Simultaneous)
    
    API->>DB: BEGIN Transaction
    API->>DB: SELECT * FROM event_seats WHERE id = A1 FOR UPDATE
    Note over DB: Locks row A1. Customer B waits.
    DB-->>API: Seat A1 is AVAILABLE
    API->>DB: UPDATE event_seats SET status = 'HELD', hold_expires_at = NOW() + 600s
    API->>DB: COMMIT Transaction
    
    API->>Redis: SET hold:event:1:seat:A1 EX 600
    API->>WS: Broadcast seatUpdated (A1 -> HELD)
    API-->>Customer A: 201 Created (Hold secured)

    Note over DB: Customer B's query executes
    DB-->>API: Seat A1 is HELD
    API->>DB: ROLLBACK Transaction
    API-->>Customer B: 409 Conflict (Seat unavailable)
```

1. **Pessimistic Row-Level Locks**: The backend executes `SELECT ... FOR UPDATE` inside an ACID transaction.
2. **All-or-Nothing Holds**: Multi-seat hold requests fail entirely if any single seat is already `HELD` or `BOOKED`.
3. **Database as Single Source of Truth**: Postgres `hold_expires_at` determines validity; Redis provides fast sub-second TTL caching.
4. **Automatic Expiration Worker**: A background worker runs every 5 seconds executing `UPDATE event_seats SET status = 'AVAILABLE' WHERE status = 'HELD' AND hold_expires_at < NOW()`, immediately notifying the Socket.IO room.

---

## 5. Waitlist & Offer Pipeline

1. **FIFO Waitlist Registration**: When an event category is sold out, users register in `waitlist_entries` (FIFO by `created_at ASC`).
2. **Auto-Assignment on Cancellation**: When a customer cancels a booking, released seats trigger `processWaitlistQueue(eventId, categoryId)`.
3. **Time-Limited Cryptographic Offer**: The first eligible waiting customer is assigned the seat with an unguessable 256-bit token (`crypto.randomBytes(32)`), an offer record with a 10-minute TTL, and an email notification with link `/waitlist-offer/{token}`.
4. **Offer Expiration & Re-Offer Chain**: If the customer fails to claim within 10 minutes, `cleanupExpiredOffers` expires the offer and immediately re-offers the seat to the next waiting FIFO customer.

---

## 6. Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@example.com` | `Admin@123` |
| **Organiser** | `organiser@example.com` | `Organiser@123` |
| **Customer** | `customer@example.com` | `Customer@123` |

---

## 7. Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ticket_booking
REDIS_URL=redis://localhost:6379
JWT_SECRET=super-secret-jwt-key-change-in-production
SEAT_HOLD_TTL_SECONDS=600
WAITLIST_OFFER_TTL_SECONDS=600
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=tickets@example.com
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 8. Local Setup & Execution Guide

### Prerequisites
- Node.js >= 18
- PostgreSQL & Redis (or zero-dependency mode using the included mock adapter)

### 1. Database Migration & Seed (PostgreSQL)
```bash
cd ticket-booking-system/backend
npm run migrate
npm run seed
```

### 2. Run Backend
```bash
cd ticket-booking-system/backend
npm install
npm run dev
```
Backend will start on `http://localhost:5000`.

### 3. Run Frontend
```bash
cd ticket-booking-system/frontend
npm install
npm run dev
```
Frontend will start on `http://localhost:5173`.

---

## 9. Running Automated Tests

Run the complete integration and concurrency test suite covering all 15 test cases:

```bash
cd ticket-booking-system/backend
npm test
```

### Verified Test Cases:
1. User registration & JWT authentication
2. Role authorization enforcement (`CUSTOMER`, `ORGANISER`, `ADMIN`)
3. Event creation & Category pricing
4. Real-time seat map retrieval
5. Successful seat hold with TTL
6. **Concurrent Seat Hold Contention** (Simultaneous parallel requests for identical seat -> exactly 1 succeeds, other receives HTTP 409 Conflict)
7. Seat hold auto-expiry release
8. Booking valid hold with QR code generation
9. Rejection of expired hold booking
10. Booking cancellation and seat release
11. Waitlist registration for sold-out category
12. Automatic waitlist offer creation on booking cancellation
13. Waitlist offer acceptance & ticket generation
14. Waitlist offer expiration
15. **Waitlist Re-Offer Chain** (Expired offer automatically re-assigns the seat to the next eligible customer in the FIFO queue)

---

## 10. Production Build & Deployment

### Build Frontend
```bash
cd ticket-booking-system/frontend
npm run build
```
Creates production-optimized static bundle in `frontend/dist/` deployable on **Vercel**, **Netlify**, or **Cloudflare Pages**.

### Deploy Backend
Deploy `backend/` on **Render**, **Railway**, or **Fly.io**:
1. Attach PostgreSQL database (e.g. Neon, Render, Supabase).
2. Attach Redis instance (e.g. Upstash, Render Redis).
3. Set environment variables from `.env.example`.
4. Run `npm run migrate` and `npm start`.
