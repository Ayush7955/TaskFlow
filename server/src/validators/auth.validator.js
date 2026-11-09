const Joi = require('joi');

const register = {
  body: Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(8).max(128).required(),
  }),
};

const login = {
  body: Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().required(),
  }),
};

module.exports = { register, login };

