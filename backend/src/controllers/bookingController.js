const bookingService = require('../services/bookingService');
const { successResponse } = require('../utils/response');
const { ValidationError } = require('../utils/errors');

const createBooking = async (req, res, next) => {
  try {
    const { eventId, seatIds } = req.body;

    if (!eventId || !Array.isArray(seatIds) || seatIds.length === 0) {
      throw new ValidationError('eventId and an array of seatIds are required');
    }

    const bookingResult = await bookingService.createBooking({
      eventId: parseInt(eventId, 10),
      seatIds: seatIds.map((id) => parseInt(id, 10)),
      userId: req.user.id
    });

    return successResponse(res, bookingResult, 201);
  } catch (error) {
    next(error);
  }
};

const getBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.getUserBookings(req.user.id);
    return successResponse(res, { bookings });
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await bookingService.getBookingById(parseInt(id, 10), req.user.id, req.user.role);
    return successResponse(res, { booking });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await bookingService.cancelBooking({
      bookingId: parseInt(id, 10),
      userId: req.user.id,
      userRole: req.user.role
    });

    return successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  cancelBooking
};
