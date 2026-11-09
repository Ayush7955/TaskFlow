'use strict';

const crypto = require('crypto');
const { WorkspaceMember, WorkspaceInvite, Workspace, User } = require('../models');
const { AppError } = require('../utils/AppError');
const { ROLES, isAtLeast } = require('../constants/roles');
const AuditLog = require('../models/AuditLog.model');
const { ACTIONS } = require('../constants/actions');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

class MemberService {
  /**
   * List workspace members.
   */
  async findAll(workspacePublicId, callerPublicId) {
    const caller = await User.findOne({ where: { public_id: callerPublicId } });
    if (!caller) throw AppError.notFound('User not found');

    const ws = await Workspace.findOne({ where: { public_id: workspacePublicId, deleted_at: null } });
    if (!ws) throw AppError.notFound('Workspace not found');

    const callerMembership = await WorkspaceMember.findOne({ where: { workspace_id: ws.id, user_id: caller.id } });
    if (!callerMembership) throw AppError.notFound('Workspace not found');

    return WorkspaceMember.findAll({
      where: { workspace_id: ws.id },
      include: [{ model: User, as: 'user', attributes: ['public_id', 'name', 'email', 'avatar_url', 'is_active'] }],
      order: [['joined_at', 'ASC']],
    });
  }

  /**
   * Change a member's role.
   */
  async changeRole(workspacePublicId, callerPublicId, memberPublicId, newRole) {
    const caller = await User.findOne({ where: { public_id: callerPublicId } });
    const ws = await Workspace.findOne({ where: { public_id: workspacePublicId, deleted_at: null } });
    if (!ws) throw AppError.notFound('Workspace not found');

    const callerMembership = await WorkspaceMember.findOne({ where: { workspace_id: ws.id, user_id: caller.id } });
    if (!callerMembership) throw AppError.notFound('Workspace not found');
    if (!isAtLeast(callerMembership.role, ROLES.ADMIN)) throw AppError.forbidden('Only admins can change roles');

    const memberUser = await User.findOne({ where: { public_id: memberPublicId } });
    if (!memberUser) throw AppError.notFound('User not found');

    const targetMembership = await WorkspaceMember.findOne({ where: { workspace_id: ws.id, user_id: memberUser.id } });
    if (!targetMembership) throw AppError.notFound('Member not in workspace');

    // Prevent demoting owner
    if (targetMembership.role === ROLES.OWNER) throw AppError.forbidden('Cannot change owner role');
    // Prevent promoting to owner via this endpoint
    if (newRole === ROLES.OWNER) throw AppError.forbidden('Use transfer ownership to change owner');

    const before = { role: targetMembership.role };
    await sequelize.transaction(async (t) => {
      targetMembership.role = newRole;
      await targetMembership.save({ transaction: t });
      await AuditLog.create(
        { workspace_id: ws.id, actor_id: caller.id, target_user_id: memberUser.id, action: ACTIONS.MEMBER_ROLE_CHANGED, entity_type: 'workspace_member', entity_id: targetMembership.id, before_state: before, after_state: { role: newRole } },
        { transaction: t }
      );
    });

    return targetMembership;
  }

  /**
   * Remove a member from workspace.
   */
  async remove(workspacePublicId, callerPublicId, memberPublicId) {
    const caller = await User.findOne({ where: { public_id: callerPublicId } });
    const ws = await Workspace.findOne({ where: { public_id: workspacePublicId, deleted_at: null } });
    if (!ws) throw AppError.notFound('Workspace not found');

    const callerMembership = await WorkspaceMember.findOne({ where: { workspace_id: ws.id, user_id: caller.id } });
    if (!callerMembership) throw AppError.notFound('Workspace not found');
    if (!isAtLeast(callerMembership.role, ROLES.ADMIN)) throw AppError.forbidden('Only admins can remove members');

    const memberUser = await User.findOne({ where: { public_id: memberPublicId } });
    if (!memberUser) throw AppError.notFound('User not found');

    const targetMembership = await WorkspaceMember.findOne({ where: { workspace_id: ws.id, user_id: memberUser.id } });
    if (!targetMembership) throw AppError.notFound('Member not in workspace');
    if (targetMembership.role === ROLES.OWNER) throw AppError.forbidden('Cannot remove the workspace owner');

    await sequelize.transaction(async (t) => {
      await targetMembership.destroy({ transaction: t });
      await AuditLog.create(
        { workspace_id: ws.id, actor_id: caller.id, target_user_id: memberUser.id, action: ACTIONS.MEMBER_REMOVED, entity_type: 'workspace_member', entity_id: targetMembership.id },
        { transaction: t }
      );
    });
  }

  /**
   * Leave workspace (self-remove).
   */
  async leave(workspacePublicId, userPublicId) {
    const user = await User.findOne({ where: { public_id: userPublicId } });
    const ws = await Workspace.findOne({ where: { public_id: workspacePublicId, deleted_at: null } });
    if (!ws) throw AppError.notFound('Workspace not found');

    const membership = await WorkspaceMember.findOne({ where: { workspace_id: ws.id, user_id: user.id } });
    if (!membership) throw AppError.notFound('Not a member of this workspace');
    if (membership.role === ROLES.OWNER) throw AppError.badRequest('Owner must transfer ownership before leaving');

    await sequelize.transaction(async (t) => {
      await membership.destroy({ transaction: t });
      await AuditLog.create(
        { workspace_id: ws.id, actor_id: user.id, action: ACTIONS.MEMBER_LEFT, entity_type: 'workspace_member', entity_id: membership.id },
        { transaction: t }
      );
    });
  }
}

class InviteService {
  /**
   * Send an invitation to an email address.
   */
  async invite(workspacePublicId, inviterPublicId, { email, role }) {
    const inviter = await User.findOne({ where: { public_id: inviterPublicId } });
    const ws = await Workspace.findOne({ where: { public_id: workspacePublicId, deleted_at: null } });
    if (!ws) throw AppError.notFound('Workspace not found');

    const callerMembership = await WorkspaceMember.findOne({ where: { workspace_id: ws.id, user_id: inviter.id } });
    if (!callerMembership) throw AppError.notFound('Workspace not found');
    if (!isAtLeast(callerMembership.role, ROLES.ADMIN)) throw AppError.forbidden('Only admins can invite members');

    // Check if email is already a member
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      const alreadyMember = await WorkspaceMember.findOne({ where: { workspace_id: ws.id, user_id: existingUser.id } });
      if (alreadyMember) throw AppError.conflict('User is already a workspace member');
    }

    // Cancel previous pending invite for same email
    await WorkspaceInvite.update(
      { status: 'expired' },
      { where: { workspace_id: ws.id, email: email.toLowerCase(), status: 'pending' } }
    );

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await sequelize.transaction(async (t) => {
      const inv = await WorkspaceInvite.create(
        { workspace_id: ws.id, inviter_id: inviter.id, email: email.toLowerCase(), role: role || ROLES.MEMBER, token, status: 'pending', expires_at: expiresAt },
        { transaction: t }
      );
      await AuditLog.create(
        { workspace_id: ws.id, actor_id: inviter.id, action: ACTIONS.MEMBER_INVITED, entity_type: 'workspace_invite', entity_id: inv.id, after_state: { email, role } },
        { transaction: t }
      );
      return inv;
    });

    // TODO: send email via email.service.js (Phase 11)
    return { invite, token };
  }

  /**
   * Accept an invite by token.
   */
  async accept(token, userPublicId) {
    const user = await User.findOne({ where: { public_id: userPublicId } });
    if (!user) throw AppError.notFound('User not found');

    const invite = await WorkspaceInvite.findOne({ where: { token, status: 'pending' } });
    if (!invite) throw AppError.notFound('Invite not found or already used');
    if (new Date() > invite.expires_at) {
      await invite.update({ status: 'expired' });
      throw AppError.badRequest('Invite has expired');
    }
    if (invite.email !== user.email) throw AppError.forbidden('This invite is for a different email address');

    await sequelize.transaction(async (t) => {
      // Add to workspace
      await WorkspaceMember.create(
        { workspace_id: invite.workspace_id, user_id: user.id, role: invite.role, joined_at: new Date() },
        { transaction: t }
      );
      await invite.update({ status: 'accepted' }, { transaction: t });
      await AuditLog.create(
        { workspace_id: invite.workspace_id, actor_id: user.id, action: ACTIONS.MEMBER_JOINED, entity_type: 'workspace_invite', entity_id: invite.id },
        { transaction: t }
      );
    });

    const ws = await Workspace.findOne({ where: { id: invite.workspace_id } });
    return ws;
  }

  /**
   * List pending invites for a workspace.
   */
  async listPending(workspacePublicId, callerPublicId) {
    const caller = await User.findOne({ where: { public_id: callerPublicId } });
    const ws = await Workspace.findOne({ where: { public_id: workspacePublicId, deleted_at: null } });
    if (!ws) throw AppError.notFound('Workspace not found');

    const callerMembership = await WorkspaceMember.findOne({ where: { workspace_id: ws.id, user_id: caller.id } });
    if (!callerMembership) throw AppError.notFound('Workspace not found');
    if (!isAtLeast(callerMembership.role, ROLES.ADMIN)) throw AppError.forbidden('Only admins can view invites');

    return WorkspaceInvite.findAll({
      where: { workspace_id: ws.id, status: 'pending', expires_at: { [Op.gt]: new Date() } },
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Revoke a pending invite.
   */
  async revoke(invitePublicId, callerPublicId) {
    const caller = await User.findOne({ where: { public_id: callerPublicId } });
    const invite = await WorkspaceInvite.findOne({ where: { public_id: invitePublicId, status: 'pending' } });
    if (!invite) throw AppError.notFound('Invite not found');

    const callerMembership = await WorkspaceMember.findOne({ where: { workspace_id: invite.workspace_id, user_id: caller.id } });
    if (!callerMembership) throw AppError.notFound('Workspace not found');
    if (!isAtLeast(callerMembership.role, ROLES.ADMIN)) throw AppError.forbidden('Only admins can revoke invites');

    await invite.update({ status: 'expired' });
  }
}

module.exports = { memberService: new MemberService(), inviteService: new InviteService() };
