'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/comment.controller');
const { authenticate } = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const Joi = require('joi');

const createSchema = Joi.object({
  content: Joi.string().trim().min(1).max(5000).required(),
  parentPublicId: Joi.string().uuid().optional(),
});
const updateSchema = Joi.object({
  content: Joi.string().trim().min(1).max(5000).required(),
});

router.use(authenticate);

// Under /cards/:cardId/comments
router.get('/', ctrl.getAll);
router.post('/', validate({ body: createSchema }), ctrl.create);

router.patch('/:commentId', validate({ body: updateSchema }), ctrl.update);
router.delete('/:commentId', ctrl.remove);

module.exports = router;

