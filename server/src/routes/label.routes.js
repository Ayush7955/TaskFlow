'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/label.controller');
const { authenticate } = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const Joi = require('joi');

const createSchema = Joi.object({
  name: Joi.string().trim().min(1).max(50).required(),
  color: Joi.string().trim().pattern(/^#[0-9a-fA-F]{6}$/).required(),
});
const updateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(50).optional(),
  color: Joi.string().trim().pattern(/^#[0-9a-fA-F]{6}$/).optional(),
}).min(1);

router.use(authenticate);

// Under /boards/:boardId/labels
router.get('/', ctrl.getAll);
router.post('/', validate({ body: createSchema }), ctrl.create);

router.patch('/:labelId', validate({ body: updateSchema }), ctrl.update);
router.delete('/:labelId', ctrl.remove);

module.exports = router;

