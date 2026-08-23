const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');

const generateAuthToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

const verifyAuthToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

const generateOfferToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const generateHoldToken = () => {
  return crypto.randomBytes(16).toString('hex');
};

const generateBookingReference = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `BK-${dateStr}-${randomStr}`;
};

module.exports = {
  generateAuthToken,
  verifyAuthToken,
  generateOfferToken,
  generateHoldToken,
  generateBookingReference
};
