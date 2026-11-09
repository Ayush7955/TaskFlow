const Joi = require('joi');

const wsId = Joi.object({ wsId: Joi.string().uuid().required() });

const create = {
  body: Joi.object({
    name: Joi.string().trim().min(1).max(120).required(),
    description: Joi.string().trim().max(500).allow('', null).optional(),
  }),
};

const update = {
  body: Joi.object({
    name: Joi.string().trim().min(1).max(120).optional(),
    description: Joi.string().trim().max(500).allow('', null).optional(),
    logo_url: Joi.string().uri().max(500).allow('', null).optional(),
  }).min(1),
  params: wsId,
};

const remove = {
  body: Joi.object({ password: Joi.string().required() }),
  params: wsId,
};

const getOne = { params: wsId };

module.exports = { create, update, remove, getOne };

