const seatHoldService = require('../services/seatHoldService');
const { successResponse } = require('../utils/response');
const { ValidationError } = require('../utils/errors');
const config = require('../config');

const createHold = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { seatIds, ttlSeconds = config.seatHoldTtlSeconds } = req.body;

    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      throw new ValidationError('seatIds must be a non-empty array of numbers');
    }

    const holdResult = await seatHoldService.holdSeats({
      eventId: parseInt(eventId, 10),
      seatIds: seatIds.map((id) => parseInt(id, 10)),
      userId: req.user.id,
      ttlSeconds
    });

    return successResponse(res, holdResult, 201);
  } catch (error) {
    next(error);
  }
};

const releaseHold = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { seatIds } = req.body;

    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      throw new ValidationError('seatIds must be a non-empty array');
    }

    const result = await seatHoldService.releaseHold({
      eventId: parseInt(eventId, 10),
      seatIds: seatIds.map((id) => parseInt(id, 10)),
      userId: req.user.id
    });

    return successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createHold,
  releaseHold
};
