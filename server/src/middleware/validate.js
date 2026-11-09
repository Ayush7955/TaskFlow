const AppError = require('../utils/AppError');

/**
 * Factory: validate({ body, query, params }) → express middleware
 */
const validate = (schemas) => (req, _res, next) => {
  const errors = [];
  const options = { abortEarly: false, stripUnknown: true, convert: true };

  ['body', 'query', 'params'].forEach((part) => {
    if (schemas[part]) {
      const { error, value } = schemas[part].validate(req[part], options);
      if (error) {
        errors.push(
          ...error.details.map((d) => ({
            path: d.path.join('.'),
            message: d.message.replace(/"/g, ''),
          })),
        );
      } else {
        req[part] = value;
      }
    }
  });

  if (errors.length > 0) {
    return next(AppError.badRequest('Validation failed', errors));
  }
  return next();
};

module.exports = validate;

