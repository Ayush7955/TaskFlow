'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/card.controller');
const { authenticate } = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const Joi = require('joi');

const createSchema = Joi.object({
  title: Joi.string().trim().min(1).max(255).required(),
  description: Joi.string().trim().max(10000).allow('').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  due_date: Joi.date().iso().allow(null).optional(),
  start_date: Joi.date().iso().allow(null).optional(),
  estimated_hours: Joi.number().integer().min(0).max(9999).allow(null).optional(),
});

const updateSchema = Joi.object({
  title: Joi.string().trim().min(1).max(255).optional(),
  description: Joi.string().trim().max(10000).allow('', null).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  due_date: Joi.date().iso().allow(null).optional(),
  start_date: Joi.date().iso().allow(null).optional(),
  is_complete: Joi.boolean().optional(),
  estimated_hours: Joi.number().integer().min(0).max(9999).allow(null).optional(),
  actual_hours: Joi.number().integer().min(0).max(9999).allow(null).optional(),
}).min(1);

const moveSchema = Joi.object({
  listPublicId: Joi.string().uuid().optional(),
  position: Joi.number().required(),
});

const addMemberSchema = Joi.object({
  userPublicId: Joi.string().uuid().required(),
});

const addLabelSchema = Joi.object({
  labelPublicId: Joi.string().uuid().required(),
});

router.use(authenticate);

// Under /lists/:listId/cards
router.get('/', ctrl.getAll);
router.post('/', validate({ body: createSchema }), ctrl.create);

// Individual card routes (mounted at /cards)
router.get('/:cardId', ctrl.getOne);
router.patch('/:cardId', validate({ body: updateSchema }), ctrl.update);
router.post('/:cardId/move', validate({ body: moveSchema }), ctrl.move);
router.post('/:cardId/archive', ctrl.archive);
router.post('/:cardId/unarchive', ctrl.unarchive);
router.delete('/:cardId', ctrl.remove);

// Members
router.post('/:cardId/members', validate({ body: addMemberSchema }), ctrl.addMember);
router.delete('/:cardId/members/:userId', ctrl.removeMember);

// Labels
router.post('/:cardId/labels', validate({ body: addLabelSchema }), ctrl.addLabel);
router.delete('/:cardId/labels/:labelId', ctrl.removeLabel);

module.exports = router;

