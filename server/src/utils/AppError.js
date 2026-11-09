class AppError extends Error {
  constructor(message, statusCode, code, details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = []) {
    return new AppError(message, 400, 'VALIDATION_ERROR', details);
  }

  static unauthenticated(message = 'Authentication required') {
    return new AppError(message, 401, 'UNAUTHENTICATED');
  }

  static tokenExpired() {
    return new AppError('Token expired', 401, 'TOKEN_EXPIRED');
  }

  static forbidden(message = 'Insufficient permissions') {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static notFound(resource = 'Resource') {
    return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
  }

  static conflict(message) {
    return new AppError(message, 409, 'CONFLICT');
  }

  static staleOrder() {
    return new AppError('Order is stale — please refresh and retry', 409, 'STALE_ORDER');
  }

  static rateLimited(retryAfter) {
    const err = new AppError('Too many requests', 429, 'RATE_LIMITED');
    err.retryAfter = retryAfter;
    return err;
  }

  static uploadRejected(reason) {
    return new AppError(reason || 'Upload rejected', 422, 'UPLOAD_REJECTED');
  }

  static internal(message = 'Internal server error') {
    const err = new AppError(message, 500, 'INTERNAL');
    err.isOperational = false;
    return err;
  }
}

module.exports = AppError;

