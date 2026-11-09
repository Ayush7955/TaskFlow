const sanitizeHtml = require('sanitize-html');

const ALLOWED_TAGS = [
  'b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li',
  'br', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
];
const ALLOWED_ATTRIBUTES = { a: ['href', 'title', 'target'] };
const SENSITIVE_FIELDS = ['password', 'password_hash', 'newPassword', 'currentPassword', 'token'];

const sanitize = (value) => {
  if (typeof value === 'string') {
    return sanitizeHtml(value, { allowedTags: ALLOWED_TAGS, allowedAttributes: ALLOWED_ATTRIBUTES });
  }
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = SENSITIVE_FIELDS.includes(key) ? value[key] : sanitize(value[key]);
      return acc;
    }, {});
  }
  return value;
};

const sanitizeInput = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }
  next();
};

module.exports = sanitizeInput;

