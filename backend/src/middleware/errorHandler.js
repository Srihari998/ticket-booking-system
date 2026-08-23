const { AppError } = require('../utils/errors');
const { errorResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode, err.code);
  }

  if (err.code === '23505') {
    return errorResponse(res, 'A record with these details already exists', 409, 'DUPLICATE_RESOURCE');
  }

  if (err.code === '23503') {
    return errorResponse(res, 'Referenced record does not exist', 400, 'FOREIGN_KEY_VIOLATION');
  }

  console.error('Unhandled Server Error:', err);
  return errorResponse(res, 'An unexpected server error occurred', 500, 'INTERNAL_ERROR');
};

module.exports = errorHandler;
