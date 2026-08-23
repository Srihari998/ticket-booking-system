const { ForbiddenError, UnauthorizedError } = require('../utils/errors');

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(`Access denied. Requires one of roles: ${allowedRoles.join(', ')}`)
      );
    }

    next();
  };
};

module.exports = {
  authorizeRoles
};
