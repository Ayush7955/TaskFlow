const AppError = require('../utils/AppError');

const notFound = (req, _res, next) => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl}`));
};

module.exports = notFound;

