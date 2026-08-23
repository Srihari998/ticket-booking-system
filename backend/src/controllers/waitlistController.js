const waitlistService = require('../services/waitlistService');
const { successResponse } = require('../utils/response');
const { ValidationError } = require('../utils/errors');
const { query } = require('../db');

const joinWaitlist = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { categoryId, quantity = 1 } = req.body;

    if (!categoryId) {
      throw new ValidationError('categoryId is required');
    }

    const result = await waitlistService.joinWaitlist({
      eventId: parseInt(eventId, 10),
      categoryId: parseInt(categoryId, 10),
      userId: req.user.id,
      quantity: parseInt(quantity, 10) || 1
    });

    return successResponse(res, result, 201);
  } catch (error) {
    next(error);
  }
};

const getEventWaitlistStats = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const statsRes = await query(
      `SELECT sc.id as category_id, sc.name as category_name,
              COUNT(we.id)::int as waiting_count
       FROM seat_categories sc
       LEFT JOIN waitlist_entries we ON (sc.id = we.category_id AND we.event_id = $1 AND we.status = 'WAITING')
       GROUP BY sc.id, sc.name
       ORDER BY sc.id ASC`,
      [eventId]
    );

    return successResponse(res, { waitlistStats: statsRes.rows });
  } catch (error) {
    next(error);
  }
};

const getUserWaitlists = async (req, res, next) => {
  try {
    const waitlists = await waitlistService.getUserWaitlists(req.user.id);
    return successResponse(res, { waitlists });
  } catch (error) {
    next(error);
  }
};

const cancelWaitlist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await waitlistService.cancelWaitlistEntry(parseInt(id, 10), req.user.id);
    return successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

const getOfferByToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    const offer = await waitlistService.getOfferByToken(token);
    return successResponse(res, { offer });
  } catch (error) {
    next(error);
  }
};

const acceptOffer = async (req, res, next) => {
  try {
    const { token } = req.params;
    const result = await waitlistService.acceptWaitlistOffer({
      token,
      userId: req.user.id
    });
    return successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  joinWaitlist,
  getEventWaitlistStats,
  getUserWaitlists,
  cancelWaitlist,
  getOfferByToken,
  acceptOffer
};
