const Joi = require('joi');

const boardIdParam = Joi.object({ boardId: Joi.string().uuid().required() });

const create = {
  body: Joi.object({
    name: Joi.string().trim().min(1).max(120).required(),
    description: Joi.string().trim().max(500).allow('', null).optional(),
    background: Joi.string().max(60).allow('', null).optional(),
    visibility: Joi.string().valid('private', 'workspace').default('workspace'),
  }),
  params: Joi.object({ wsId: Joi.string().uuid().required() }),
};

const update = {
  body: Joi.object({
    name: Joi.string().trim().min(1).max(120).optional(),
    description: Joi.string().trim().max(500).allow('', null).optional(),
    background: Joi.string().max(60).allow('', null).optional(),
    visibility: Joi.string().valid('private', 'workspace').optional(),
  }).min(1),
  params: boardIdParam,
};

module.exports = { create, update };

