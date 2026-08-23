const { cleanupExpiredHolds } = require('../services/seatHoldService');
const { cleanupExpiredOffers } = require('../services/waitlistService');

let intervalId = null;

const runCleanupCycle = async () => {
  try {
    await cleanupExpiredHolds();
    await cleanupExpiredOffers();
  } catch (error) {
    console.error('Error during expiration worker cycle:', error);
  }
};

const startExpirationWorker = (intervalMs = 5000) => {
  if (intervalId) return;
  intervalId = setInterval(runCleanupCycle, intervalMs);
};

const stopExpirationWorker = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

module.exports = {
  startExpirationWorker,
  stopExpirationWorker,
  runCleanupCycle
};
