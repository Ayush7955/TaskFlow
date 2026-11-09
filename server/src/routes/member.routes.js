'use strict';

const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/member.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const Joi = require('joi');

const inviteSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('admin', 'member').default('member'),
});

const changeRoleSchema = Joi.object({
  role: Joi.string().valid('admin', 'member').required(),
});

router.use(authenticate);

// Under /workspaces/:workspaceId/members
router.get('/', ctrl.listMembers);
router.delete('/leave', ctrl.leave);
router.patch('/:userId/role', validate({ body: changeRoleSchema }), ctrl.changeRole);
router.delete('/:userId', ctrl.removeMember);

// Invites under /workspaces/:workspaceId/invites
router.get('/invites', ctrl.listInvites);
router.post('/invites', validate({ body: inviteSchema }), ctrl.invite);
router.delete('/invites/:inviteId', ctrl.revokeInvite);

module.exports = router;

