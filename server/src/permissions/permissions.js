'use strict';

const { ROLES, ROLE_RANK, isAtLeast } = require('../constants/roles');
const { AppError } = require('../utils/AppError');

/**
 * Permission map — resource:action → minimum role required.
 * Any role AT OR ABOVE the minimum is allowed.
 *
 * Role hierarchy (lowest → highest): member < admin < owner
 */
const PERMISSIONS = {
  // ─── Workspace ─────────────────────────────────────────────────────────────
  'workspace:view':              ROLES.MEMBER,
  'workspace:update':            ROLES.ADMIN,
  'workspace:delete':            ROLES.OWNER,
  'workspace:transfer_ownership': ROLES.OWNER,
  'workspace:manage_billing':    ROLES.OWNER,

  // ─── Workspace Members ─────────────────────────────────────────────────────
  'member:invite':               ROLES.ADMIN,
  'member:remove':               ROLES.ADMIN,
  'member:change_role':          ROLES.ADMIN,
  'member:view':                 ROLES.MEMBER,

  // ─── Boards ────────────────────────────────────────────────────────────────
  'board:create':                ROLES.MEMBER,
  'board:view':                  ROLES.MEMBER,
  'board:update':                ROLES.ADMIN,
  'board:archive':               ROLES.ADMIN,
  'board:restore':               ROLES.ADMIN,
  'board:delete':                ROLES.OWNER,
  'board:change_visibility':     ROLES.ADMIN,

  // ─── Lists ──────────────────────────────────────────────────────────────────
  'list:create':                 ROLES.MEMBER,
  'list:view':                   ROLES.MEMBER,
  'list:update':                 ROLES.MEMBER,
  'list:archive':                ROLES.ADMIN,
  'list:delete':                 ROLES.ADMIN,
  'list:move':                   ROLES.MEMBER,

  // ─── Cards ──────────────────────────────────────────────────────────────────
  'card:create':                 ROLES.MEMBER,
  'card:view':                   ROLES.MEMBER,
  'card:update':                 ROLES.MEMBER,
  'card:move':                   ROLES.MEMBER,
  'card:archive':                ROLES.MEMBER,
  'card:delete':                 ROLES.ADMIN,
  'card:assign_member':          ROLES.MEMBER,
  'card:unassign_member':        ROLES.MEMBER,
  'card:add_label':              ROLES.MEMBER,
  'card:remove_label':           ROLES.MEMBER,

  // ─── Checklists ─────────────────────────────────────────────────────────────
  'checklist:create':            ROLES.MEMBER,
  'checklist:update':            ROLES.MEMBER,
  'checklist:delete':            ROLES.MEMBER,
  'checklist:item:create':       ROLES.MEMBER,
  'checklist:item:update':       ROLES.MEMBER,
  'checklist:item:delete':       ROLES.MEMBER,

  // ─── Comments ───────────────────────────────────────────────────────────────
  'comment:create':              ROLES.MEMBER,
  'comment:update_own':          ROLES.MEMBER,   // own comment only
  'comment:delete_own':          ROLES.MEMBER,   // own comment
  'comment:delete_any':          ROLES.ADMIN,    // admin can delete any

  // ─── Attachments ────────────────────────────────────────────────────────────
  'attachment:upload':           ROLES.MEMBER,
  'attachment:delete_own':       ROLES.MEMBER,
  'attachment:delete_any':       ROLES.ADMIN,

  // ─── Labels ─────────────────────────────────────────────────────────────────
  'label:create':                ROLES.MEMBER,
  'label:update':                ROLES.MEMBER,
  'label:delete':                ROLES.ADMIN,

  // ─── Audit Logs ─────────────────────────────────────────────────────────────
  'audit:view':                  ROLES.ADMIN,

  // ─── Notifications ──────────────────────────────────────────────────────────
  'notification:read':           ROLES.MEMBER,
};

/**
 * Check if a role has the given permission.
 * @param {string} role - workspace member role
 * @param {string} permission - permission string e.g. 'card:delete'
 * @returns {boolean}
 */
function can(role, permission) {
  const minRole = PERMISSIONS[permission];
  if (!minRole) {
    // Unknown permission — deny by default
    return false;
  }
  return isAtLeast(role, minRole);
}

/**
 * Assert that a role has the given permission; throw 403 if not.
 * @param {string} role
 * @param {string} permission
 * @throws {AppError} 403 Forbidden
 */
function assertCan(role, permission) {
  if (!can(role, permission)) {
    throw AppError.forbidden(`Insufficient permissions: "${permission}" requires at least ${PERMISSIONS[permission]}`);
  }
}

module.exports = { PERMISSIONS, can, assertCan };
