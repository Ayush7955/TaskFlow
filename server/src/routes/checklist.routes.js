'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/checklist.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const Joi = require('joi');

const clSchema = Joi.object({ title: Joi.string().trim().min(1).max(255).required() });
const clUpdateSchema = Joi.object({ title: Joi.string().trim().min(1).max(255).required() });
const itemSchema = Joi.object({
  content: Joi.string().trim().min(1).max(500).required(),
  due_date: Joi.date().iso().allow(null).optional(),
});
const itemUpdateSchema = Joi.object({
  content: Joi.string().trim().min(1).max(500).optional(),
  is_checked: Joi.boolean().optional(),
  due_date: Joi.date().iso().allow(null).optional(),
  assignee_id: Joi.number().integer().allow(null).optional(),
}).min(1);

router.use(authenticate);

// Under /cards/:cardId/checklists
router.get('/', ctrl.getAll);
router.post('/', validate({ body: clSchema }), ctrl.create);

// Checklist-level
router.patch('/:checklistId', validate({ body: clUpdateSchema }), ctrl.update);
router.delete('/:checklistId', ctrl.remove);

// Checklist items
router.post('/:checklistId/items', validate({ body: itemSchema }), ctrl.createItem);
router.patch('/:checklistId/items/:itemId', validate({ body: itemUpdateSchema }), ctrl.updateItem);
router.delete('/:checklistId/items/:itemId', ctrl.removeItem);

module.exports = router;

