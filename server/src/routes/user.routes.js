'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const Joi = require('joi');

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  avatarUrl: Joi.string().uri().allow('', null).optional(),
}).min(1);

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
    .messages({ 'string.pattern.base': 'Password must have uppercase, lowercase, and number' }),
});

const deactivateSchema = Joi.object({
  password: Joi.string().required(),
});

router.use(authenticate);

router.get('/me', ctrl.getProfile);
router.patch('/me', validate({ body: updateProfileSchema }), ctrl.updateProfile);
router.post('/me/change-password', validate({ body: changePasswordSchema }), ctrl.changePassword);
router.delete('/me', validate({ body: deactivateSchema }), ctrl.deactivate);

module.exports = router;

