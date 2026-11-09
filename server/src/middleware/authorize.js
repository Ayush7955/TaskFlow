'use strict';

const { WorkspaceMember, Board, List, Card, Workspace } = require('../models');
const { can, assertCan } = require('../permissions/permissions');
const { AppError } = require('../utils/AppError');

/**
 * Authorize middleware factory.
 * Resolves the user's workspace role and checks the given permission.
 *
 * Usage:
 *   router.delete('/:boardId', authorize('board:delete'), ctrl.remove)
 *
 * Resource resolution strategy:
 *   - If req.params.workspaceId exists → use it directly
 *   - If req.params.boardId exists → lookup board.workspace_id
 *   - If req.params.listId exists → lookup list.board.workspace_id
 *   - If req.params.cardId exists → lookup card.board.workspace_id
 *
 * @param {string} permission - permission key from permissions.js
 */
function authorize(permission) {
  return async (req, _res, next) => {
    try {
      const { User } = require('../models');
      const user = await User.findOne({ where: { public_id: req.user.publicId } });
      if (!user) return next(AppError.unauthorized('User not found'));

      const workspaceId = await resolveWorkspaceId(req);
      if (!workspaceId) return next(AppError.notFound('Resource not found'));

      const membership = await WorkspaceMember.findOne({
        where: { workspace_id: workspaceId, user_id: user.id },
      });

      // Not a member → 404 (don't leak existence)
      if (!membership) return next(AppError.notFound('Resource not found'));

      // Store role for downstream use
      req.workspaceRole = membership.role;
      req.workspaceId = workspaceId;

      assertCan(membership.role, permission);
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Resolve workspace internal ID from request params.
 */
async function resolveWorkspaceId(req) {
  const { workspaceId, boardId, listId, cardId } = req.params;

  if (workspaceId) {
    const ws = await Workspace.findOne({ where: { public_id: workspaceId, deleted_at: null } });
    return ws ? ws.id : null;
  }

  if (boardId) {
    const board = await Board.findOne({ where: { public_id: boardId, deleted_at: null } });
    return board ? board.workspace_id : null;
  }

  if (listId) {
    const list = await List.findOne({
      where: { public_id: listId, deleted_at: null },
      include: [{ model: Board, as: 'board' }],
    });
    return list ? list.board.workspace_id : null;
  }

  if (cardId) {
    const card = await Card.findOne({
      where: { public_id: cardId, deleted_at: null },
      include: [{ model: List, as: 'list', include: [{ model: Board, as: 'board' }] }],
    });
    return card ? card.list.board.workspace_id : null;
  }

  return null;
}

module.exports = { authorize };
