# REST API Documentation

Base URL: `http://localhost:5000/api`

---

## 1. Authentication Endpoints

### Register User
`POST /api/auth/register`

**Request Body:**
```json
{
  "name": "Alex Johnson",
  "email": "alex@example.com",
  "password": "Password@123",
  "role": "CUSTOMER"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 4,
      "name": "Alex Johnson",
      "email": "alex@example.com",
      "role": "CUSTOMER",
      "createdAt": "2026-08-23T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login User
`POST /api/auth/login`

**Request Body:**
```json
{
  "email": "customer@example.com",
  "password": "Customer@123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 3,
      "name": "Jane Customer",
      "email": "customer@example.com",
      "role": "CUSTOMER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Current User Profile
`GET /api/auth/me`
*Headers: `Authorization: Bearer <token>`*

---

## 2. Events Endpoints

### List Events
`GET /api/events?search=beethoven&eventType=CONCERT&startDate=2026-09-01`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": 1,
        "title": "Beethoven Symphony No. 9",
        "description": "Live concert performance.",
        "event_type": "CONCERT",
        "event_date": "2026-09-15",
        "start_time": "19:30:00",
        "venue_name": "Grand Symphony Hall",
        "venue_location": "100 Concert Blvd",
        "prices": [
          { "categoryId": 1, "categoryName": "Premium", "price": 120.00 },
          { "categoryId": 2, "categoryName": "Standard", "price": 75.00 }
        ],
        "total_seats": 30,
        "available_seats": 28
      }
    ]
  }
}
```

### Get Event Details & Availability
`GET /api/events/:id`

### Get Real-Time Seat Map
`GET /api/events/:id/seats`
*Headers: `Authorization: Bearer <token>` (optional)*

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "seats": [
      {
        "id": 1,
        "venueSeatId": 1,
        "rowLabel": "A",
        "seatNumber": 1,
        "categoryId": 1,
        "categoryName": "Premium",
        "price": 120.00,
        "status": "AVAILABLE",
        "isMyHold": false,
        "holdExpiresAt": null
      }
    ]
  }
}
```

### Create Event (Organiser / Admin)
`POST /api/events`
*Headers: `Authorization: Bearer <token>`*

**Request Body:**
```json
{
  "title": "Hans Zimmer Live",
  "description": "Orchestral film music showcase.",
  "eventType": "CONCERT",
  "eventDate": "2026-10-15",
  "startTime": "20:00:00",
  "venueId": 1,
  "categoryPrices": [
    { "categoryId": 1, "price": 150.00 },
    { "categoryId": 2, "price": 85.00 }
  ]
}
```

---

## 3. Seat Hold Endpoints

### Place Seat Hold
`POST /api/events/:eventId/holds`
*Headers: `Authorization: Bearer <token>`*

**Request Body:**
```json
{
  "seatIds": [1, 2],
  "ttlSeconds": 600
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "holdToken": "7b8e1f58a36c841e2d49",
    "expiresAt": "2026-08-23T10:10:00.000Z",
    "heldSeatsCount": 2,
    "seatIds": [1, 2]
  }
}
```

**Error Response (409 Conflict):**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Seat A1 is no longer available"
  }
}
```

### Explicitly Release Hold
`DELETE /api/events/:eventId/holds`
*Headers: `Authorization: Bearer <token>`*

---

## 4. Bookings Endpoints

### Confirm Booking
`POST /api/bookings`
*Headers: `Authorization: Bearer <token>`*

**Request Body:**
```json
{
  "eventId": 1,
  "seatIds": [1, 2]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "bookingId": 12,
    "bookingReference": "BK-20260823-A7F2D1",
    "totalAmount": 240.00,
    "seatsCount": 2,
    "qrDataUrl": "data:image/png;base64,iVBORw0KGgo...",
    "seats": [
      { "id": 1, "rowLabel": "A", "seatNumber": 1, "categoryName": "Premium", "price": 120.00 },
      { "id": 2, "rowLabel": "A", "seatNumber": 2, "categoryName": "Premium", "price": 120.00 }
    ]
  }
}
```

### User Booking History
`GET /api/bookings`
*Headers: `Authorization: Bearer <token>`*

### Get Booking Details with QR Pass
`GET /api/bookings/:id`
*Headers: `Authorization: Bearer <token>`*

### Cancel Booking
`POST /api/bookings/:id/cancel`
*Headers: `Authorization: Bearer <token>`*

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "bookingId": 12,
    "bookingReference": "BK-20260823-A7F2D1",
    "status": "CANCELLED",
    "releasedSeatsCount": 2
  }
}
```

---

## 5. Waitlist & Offer Endpoints

### Join FIFO Waitlist
`POST /api/events/:eventId/waitlist`
*Headers: `Authorization: Bearer <token>`*

**Request Body:**
```json
{
  "categoryId": 1,
  "quantity": 2
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "event_id": 1,
    "user_id": 3,
    "category_id": 1,
    "quantity": 2,
    "status": "WAITING",
    "queuePosition": 1
  }
}
```

### Inspect Waitlist Offer by Token
`GET /api/waitlist-offers/:token`

### Accept Waitlist Offer
`POST /api/waitlist-offers/:token/accept`
*Headers: `Authorization: Bearer <token>`*

---

## 6. Organiser Analytics Endpoints

### Organiser Event Summaries & Revenue
`GET /api/organiser/events/:eventId/summary`
*Headers: `Authorization: Bearer <token>`*

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalSeats": 30,
      "bookedSeats": 24,
      "heldSeats": 2,
      "availableSeats": 4,
      "occupancyPercentage": 80.0,
      "totalRevenue": 2450.00,
      "bookingCount": 14,
      "waitlistCount": 3
    }
  }
}
```
