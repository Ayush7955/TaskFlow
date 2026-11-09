const AppError = require('../utils/AppError');
const logger = require('../config/logger');

// Handle Sequelize errors lazily to avoid circular dep issues
const mapSequelizeError = (err) => {
  const name = err.name || '';
  if (name === 'SequelizeValidationError') {
    const details = err.errors.map((e) => ({ path: e.path, message: e.message }));
    return AppError.badRequest('Validation failed', details);
  }
  if (name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'field';
    return AppError.conflict(`${field} already exists`);
  }
  if (name === 'SequelizeForeignKeyConstraintError') {
    return AppError.badRequest('Referenced resource does not exist');
  }
  if (name === 'SequelizeConnectionError' || name === 'SequelizeConnectionRefusedError') {
    return AppError.internal('Database connection failed');
  }
  return null;
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let error = err;

  const sequelizeMapped = mapSequelizeError(err);
  if (sequelizeMapped) {
    error = sequelizeMapped;
  } else if (!err.isOperational) {
    logger.error({ err, requestId: req.id }, 'Unhandled non-operational error');
    error = AppError.internal();
  }

  if (error.statusCode >= 500) {
    logger.error({ err: error, requestId: req.id }, 'Server error');
  }

  const statusCode = error.statusCode || 500;
  const body = {
    success: false,
    error: {
      code: error.code || 'INTERNAL',
      message: statusCode >= 500 && process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message,
      requestId: req.id,
    },
  };

  if (error.details && error.details.length > 0) {
    body.error.details = error.details;
  }
  if (error.retryAfter) {
    body.error.retryAfter = error.retryAfter;
    res.setHeader('Retry-After', error.retryAfter);
  }

  res.status(statusCode).json(body);
};

module.exports = errorHandler;

