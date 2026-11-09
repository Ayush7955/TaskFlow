'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/list.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const Joi = require('joi');

const createSchema = Joi.object({
  name: Joi.string().trim().min(1).max(150).required(),
  color: Joi.string().trim().pattern(/^#[0-9a-fA-F]{6}$/).optional(),
});

const updateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(150).optional(),
  color: Joi.string().trim().pattern(/^#[0-9a-fA-F]{6}$/).allow(null).optional(),
}).min(1);

router.use(authenticate);

// Under /boards/:boardId/lists
router.get('/', ctrl.getAll);
router.post('/', validate({ body: createSchema }), ctrl.create);

// Under /lists/:listId
router.patch('/:listId', validate({ body: updateSchema }), ctrl.update);
router.post('/:listId/archive', ctrl.archive);
router.post('/:listId/unarchive', ctrl.unarchive);
router.delete('/:listId', ctrl.remove);

module.exports = router;

