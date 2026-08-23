require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ticket_booking',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'default-super-secret-jwt-key-for-ticket-booking-system',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  seatHoldTtlSeconds: parseInt(process.env.SEAT_HOLD_TTL_SECONDS, 10) || 600,
  waitlistOfferTtlSeconds: parseInt(process.env.WAITLIST_OFFER_TTL_SECONDS, 10) || 600,
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'tickets@ticketbooking.local'
  }
};
