'use strict';

const { GraphQLScalarType, Kind } = require('graphql');
const { requireAuth } = require('../context');
const authService = require('../../services/auth.service');
const workspaceService = require('../../services/workspace.service');
const boardService = require('../../services/board.service');
const cardService = require('../../services/card.service');
const listService = require('../../services/list.service');
const checklistService = require('../../services/checklist.service');
const labelService = require('../../services/label.service');
const commentService = require('../../services/comment.service');
const { Notification, User, Workspace, Board, List } = require('../../models');

// ─── Scalars ─────────────────────────────────────────────────────────────────

const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO-8601 datetime string',
  serialize: (value) => (value instanceof Date ? value.toISOString() : value),
  parseValue: (value) => new Date(value),
  parseLiteral: (ast) => (ast.kind === Kind.STRING ? new Date(ast.value) : null),
});

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON value',
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: (ast) => {
    if (ast.kind === Kind.STRING) return JSON.parse(ast.value);
    return null;
  },
});

// ─── Resolvers ────────────────────────────────────────────────────────────────

const resolvers = {
  DateTime: DateTimeScalar,
  JSON: JSONScalar,

  Query: {
    me: async (_parent, _args, ctx) => {
      requireAuth(ctx);
      const user = await User.findOne({ where: { public_id: ctx.user.publicId } });
      if (!user) throw new Error('User not found');
      return user;
    },

    workspaces: async (_parent, _args, ctx) => {
      requireAuth(ctx);
      const result = await workspaceService.findAllForUser(ctx.user.publicId, { page: 1, perPage: 100 });
      return result.data;
    },

    workspace: async (_parent, { slug }, ctx) => {
      requireAuth(ctx);
      const ws = await Workspace.findOne({ where: { slug, deleted_at: null } });
      if (!ws) throw new Error('Workspace not found');
      return ws;
    },

    board: async (_parent, { boardId }, ctx) => {
      requireAuth(ctx);
      return boardService.findById(boardId, ctx.user.publicId);
    },

    boardPayload: async (_parent, { boardId }, ctx) => {
      requireAuth(ctx);
      const payload = await cardService.getBoardPayload(boardId, ctx.user.publicId);
      return payload.board;
    },

    card: async (_parent, { cardId }, ctx) => {
      requireAuth(ctx);
      return cardService.findById(cardId, ctx.user.publicId);
    },

    cards: async (_parent, { listId, page = 1, perPage = 50 }, ctx) => {
      requireAuth(ctx);
      return cardService.findAllInList(listId, ctx.user.publicId, { page, perPage });
    },

    notifications: async (_parent, { page = 1, perPage = 20 }, ctx) => {
      requireAuth(ctx);
      const user = await User.findOne({ where: { public_id: ctx.user.publicId } });
      const { count, rows } = await Notification.findAndCountAll({
        where: { user_id: user.id },
        order: [['created_at', 'DESC']],
        limit: perPage,
        offset: (page - 1) * perPage,
      });
      const totalPages = Math.ceil(count / perPage);
      return {
        data: rows,
        meta: { page, perPage, total: count, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
      };
    },

    unreadNotificationCount: async (_parent, _args, ctx) => {
      requireAuth(ctx);
      const user = await User.findOne({ where: { public_id: ctx.user.publicId } });
      return Notification.count({ where: { user_id: user.id, is_read: false } });
    },

    auditLogs: async (_parent, { workspaceId, page = 1, perPage = 50 }, ctx) => {
      requireAuth(ctx);
      const { AuditLog } = require('../../models');
      const ws = await Workspace.findOne({ where: { public_id: workspaceId } });
      if (!ws) throw new Error('Workspace not found');
      const { count, rows } = await AuditLog.findAndCountAll({
        where: { workspace_id: ws.id },
        order: [['created_at', 'DESC']],
        limit: perPage,
        offset: (page - 1) * perPage,
      });
      const totalPages = Math.ceil(count / perPage);
      return {
        data: rows,
        meta: { page, perPage, total: count, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
      };
    },
  },

  Mutation: {
    // Workspaces
    createWorkspace: async (_p, { name, description }, ctx) => {
      requireAuth(ctx);
      return workspaceService.create(ctx.user.publicId, { name, description });
    },
    updateWorkspace: async (_p, { workspaceId, ...updates }, ctx) => {
      requireAuth(ctx);
      return workspaceService.update(workspaceId, ctx.user.publicId, updates);
    },
    deleteWorkspace: async (_p, { workspaceId, password }, ctx) => {
      requireAuth(ctx);
      await workspaceService.softDelete(workspaceId, ctx.user.publicId, password);
      return true;
    },

    // Boards
    createBoard: async (_p, { workspaceId, ...data }, ctx) => {
      requireAuth(ctx);
      return boardService.create(workspaceId, ctx.user.publicId, data);
    },
    updateBoard: async (_p, { boardId, ...data }, ctx) => {
      requireAuth(ctx);
      return boardService.update(boardId, ctx.user.publicId, data);
    },
    archiveBoard: async (_p, { boardId }, ctx) => {
      requireAuth(ctx);
      return boardService.archive(boardId, ctx.user.publicId);
    },
    restoreBoard: async (_p, { boardId }, ctx) => {
      requireAuth(ctx);
      return boardService.restore(boardId, ctx.user.publicId);
    },
    deleteBoard: async (_p, { boardId }, ctx) => {
      requireAuth(ctx);
      await boardService.softDelete(boardId, ctx.user.publicId);
      return true;
    },

    // Lists
    createList: async (_p, { boardId, name, color }, ctx) => {
      requireAuth(ctx);
      return listService.create(boardId, ctx.user.publicId, { name, color });
    },
    updateList: async (_p, { listId, ...updates }, ctx) => {
      requireAuth(ctx);
      return listService.update(listId, ctx.user.publicId, updates);
    },
    archiveList: async (_p, { listId }, ctx) => {
      requireAuth(ctx);
      return listService.setArchived(listId, ctx.user.publicId, true);
    },
    unarchiveList: async (_p, { listId }, ctx) => {
      requireAuth(ctx);
      return listService.setArchived(listId, ctx.user.publicId, false);
    },
    deleteList: async (_p, { listId }, ctx) => {
      requireAuth(ctx);
      await listService.softDelete(listId, ctx.user.publicId);
      return true;
    },

    // Cards
    createCard: async (_p, { listId, ...data }, ctx) => {
      requireAuth(ctx);
      return cardService.create(listId, ctx.user.publicId, data);
    },
    updateCard: async (_p, { cardId, ...data }, ctx) => {
      requireAuth(ctx);
      return cardService.update(cardId, ctx.user.publicId, data);
    },
    moveCard: async (_p, { cardId, listId, position }, ctx) => {
      requireAuth(ctx);
      return cardService.move(cardId, ctx.user.publicId, { listPublicId: listId, position });
    },
    archiveCard: async (_p, { cardId }, ctx) => {
      requireAuth(ctx);
      return cardService.setArchived(cardId, ctx.user.publicId, true);
    },
    unarchiveCard: async (_p, { cardId }, ctx) => {
      requireAuth(ctx);
      return cardService.setArchived(cardId, ctx.user.publicId, false);
    },
    deleteCard: async (_p, { cardId }, ctx) => {
      requireAuth(ctx);
      await cardService.softDelete(cardId, ctx.user.publicId);
      return true;
    },

    assignMember: async (_p, { cardId, userId }, ctx) => {
      requireAuth(ctx);
      await cardService.addMember(cardId, ctx.user.publicId, userId);
      return true;
    },
    unassignMember: async (_p, { cardId, userId }, ctx) => {
      requireAuth(ctx);
      await cardService.removeMember(cardId, ctx.user.publicId, userId);
      return true;
    },

    // Labels
    createLabel: async (_p, { boardId, name, color }, ctx) => {
      requireAuth(ctx);
      return labelService.create(boardId, ctx.user.publicId, { name, color });
    },
    updateLabel: async (_p, { labelId, ...data }, ctx) => {
      requireAuth(ctx);
      return labelService.update(labelId, ctx.user.publicId, data);
    },
    deleteLabel: async (_p, { labelId }, ctx) => {
      requireAuth(ctx);
      await labelService.delete(labelId, ctx.user.publicId);
      return true;
    },
    addLabelToCard: async (_p, { cardId, labelId }, ctx) => {
      requireAuth(ctx);
      await cardService.addLabel(cardId, ctx.user.publicId, labelId);
      return true;
    },
    removeLabelFromCard: async (_p, { cardId, labelId }, ctx) => {
      requireAuth(ctx);
      await cardService.removeLabel(cardId, ctx.user.publicId, labelId);
      return true;
    },

    // Checklists
    createChecklist: async (_p, { cardId, title }, ctx) => {
      requireAuth(ctx);
      return checklistService.createChecklist(cardId, ctx.user.publicId, { title });
    },
    updateChecklist: async (_p, { checklistId, title }, ctx) => {
      requireAuth(ctx);
      return checklistService.updateChecklist(checklistId, ctx.user.publicId, { title });
    },
    deleteChecklist: async (_p, { checklistId }, ctx) => {
      requireAuth(ctx);
      await checklistService.deleteChecklist(checklistId, ctx.user.publicId);
      return true;
    },
    createChecklistItem: async (_p, { checklistId, content, dueDate }, ctx) => {
      requireAuth(ctx);
      return checklistService.createItem(checklistId, ctx.user.publicId, { content, due_date: dueDate });
    },
    updateChecklistItem: async (_p, { itemId, ...data }, ctx) => {
      requireAuth(ctx);
      return checklistService.updateItem(itemId, ctx.user.publicId, {
        content: data.content,
        is_checked: data.isChecked,
        due_date: data.dueDate,
      });
    },
    deleteChecklistItem: async (_p, { itemId }, ctx) => {
      requireAuth(ctx);
      await checklistService.deleteItem(itemId, ctx.user.publicId);
      return true;
    },

    // Comments
    createComment: async (_p, { cardId, content, parentId }, ctx) => {
      requireAuth(ctx);
      return commentService.create(cardId, ctx.user.publicId, { content, parentPublicId: parentId });
    },
    updateComment: async (_p, { commentId, content }, ctx) => {
      requireAuth(ctx);
      return commentService.update(commentId, ctx.user.publicId, { content });
    },
    deleteComment: async (_p, { commentId }, ctx) => {
      requireAuth(ctx);
      await commentService.delete(commentId, ctx.user.publicId);
      return true;
    },

    // Notifications
    markNotificationRead: async (_p, { notificationId }, ctx) => {
      requireAuth(ctx);
      const user = await User.findOne({ where: { public_id: ctx.user.publicId } });
      const notif = await Notification.findOne({ where: { public_id: notificationId, user_id: user.id } });
      if (!notif) throw new Error('Notification not found');
      notif.is_read = true;
      notif.read_at = new Date();
      await notif.save();
      return notif;
    },
    markAllNotificationsRead: async (_p, _args, ctx) => {
      requireAuth(ctx);
      const user = await User.findOne({ where: { public_id: ctx.user.publicId } });
      await Notification.update(
        { is_read: true, read_at: new Date() },
        { where: { user_id: user.id, is_read: false } }
      );
      return true;
    },
  },

  // ─── Type resolvers (using DataLoaders) ────────────────────────────────────

  User: {
    publicId: (u) => u.public_id,
    avatarUrl: (u) => u.avatar_url,
    isVerified: (u) => u.is_verified,
    createdAt: (u) => u.created_at,
  },

  Workspace: {
    publicId: (ws) => ws.public_id,
    logoUrl: (ws) => ws.logo_url,
    owner: (ws, _args, ctx) => ctx.loaders.userById.load(ws.owner_id),
    members: async (ws) => {
      const { WorkspaceMember } = require('../../models');
      return WorkspaceMember.findAll({ where: { workspace_id: ws.id }, include: [{ model: User, as: 'user' }] });
    },
    boards: async (ws, _args, ctx) => {
      return Board.findAll({ where: { workspace_id: ws.id, deleted_at: null }, order: [['created_at', 'DESC']] });
    },
    createdAt: (ws) => ws.created_at,
    updatedAt: (ws) => ws.updated_at,
  },

  WorkspaceMember: {
    user: (m, _args, ctx) => ctx.loaders.userById.load(m.user_id),
    joinedAt: (m) => m.joined_at,
  },

  Board: {
    publicId: (b) => b.public_id,
    backgroundColor: (b) => b.background_color,
    coverImageUrl: (b) => b.cover_image_url,
    workspace: async (b) => Workspace.findOne({ where: { id: b.workspace_id } }),
    creator: (b, _args, ctx) => ctx.loaders.userById.load(b.created_by),
    lists: (b, _args, ctx) => ctx.loaders.listsByBoardId.load(b.id),
    labels: (b, _args, ctx) => ctx.loaders.labelsByBoardId.load(b.id),
    createdAt: (b) => b.created_at,
    updatedAt: (b) => b.updated_at,
  },

  List: {
    publicId: (l) => l.public_id,
    isArchived: (l) => l.is_archived,
    board: (l, _args, ctx) => ctx.loaders.boardById.load(l.board_id),
    cards: (l, _args, ctx) => ctx.loaders.cardsByListId.load(l.id),
    createdAt: (l) => l.created_at,
    updatedAt: (l) => l.updated_at,
  },

  Card: {
    publicId: (c) => c.public_id,
    dueDate: (c) => c.due_date,
    startDate: (c) => c.start_date,
    isComplete: (c) => c.is_complete,
    isArchived: (c) => c.is_archived,
    estimatedHours: (c) => c.estimated_hours,
    actualHours: (c) => c.actual_hours,
    list: async (c) => List.findOne({ where: { id: c.list_id } }),
    board: (c, _args, ctx) => ctx.loaders.boardById.load(c.board_id),
    creator: (c, _args, ctx) => ctx.loaders.userById.load(c.created_by),
    assignees: (c, _args, ctx) => ctx.loaders.assigneesByCardId.load(c.id),
    labels: (c, _args, ctx) => ctx.loaders.labelsByCardId.load(c.id),
    checklists: (c, _args, ctx) => ctx.loaders.checklistsByCardId.load(c.id),
    attachments: (c, _args, ctx) => ctx.loaders.attachmentsByCardId.load(c.id),
    comments: (c, _args, ctx) => ctx.loaders.commentsByCardId.load(c.id),
    checklistProgress: async (c, _args, ctx) => {
      const { ChecklistItem, Checklist } = require('../../models');
      const cls = await ctx.loaders.checklistsByCardId.load(c.id);
      const clIds = cls.map((cl) => cl.id);
      if (clIds.length === 0) return { total: 0, completed: 0, percentage: 0 };
      const items = await ChecklistItem.findAll({ where: { checklist_id: clIds } });
      const total = items.length;
      const completed = items.filter((i) => i.is_checked).length;
      return { total, completed, percentage: total === 0 ? 0 : Math.round((completed / total) * 100) };
    },
    createdAt: (c) => c.created_at,
    updatedAt: (c) => c.updated_at,
  },

  Label: {
    publicId: (l) => l.public_id,
    board: (l, _args, ctx) => ctx.loaders.boardById.load(l.board_id),
  },

  Checklist: {
    publicId: (cl) => cl.public_id,
    items: (cl, _args, ctx) => ctx.loaders.itemsByChecklistId.load(cl.id),
    card: async (cl) => {
      const { Card } = require('../../models');
      return Card.findOne({ where: { id: cl.card_id } });
    },
    createdAt: (cl) => cl.created_at,
  },

  ChecklistItem: {
    publicId: (i) => i.public_id,
    isChecked: (i) => i.is_checked,
    dueDate: (i) => i.due_date,
    assignee: (i, _args, ctx) => i.assignee_id ? ctx.loaders.userById.load(i.assignee_id) : null,
    createdAt: (i) => i.created_at,
  },

  Attachment: {
    publicId: (a) => a.public_id,
    originalName: (a) => a.original_name,
    mimeType: (a) => a.mime_type,
    fileSize: (a) => a.file_size,
    uploadedBy: (a, _args, ctx) => ctx.loaders.userById.load(a.uploaded_by),
    createdAt: (a) => a.created_at,
  },

  Comment: {
    publicId: (c) => c.public_id,
    isEdited: (c) => c.is_edited,
    author: (c, _args, ctx) => ctx.loaders.userById.load(c.user_id),
    card: async (c) => {
      const { Card } = require('../../models');
      return Card.findOne({ where: { id: c.card_id } });
    },
    parent: async (c) => {
      if (!c.parent_id) return null;
      const { Comment } = require('../../models');
      return Comment.findOne({ where: { id: c.parent_id } });
    },
    replies: async (c) => {
      const { Comment } = require('../../models');
      return Comment.findAll({ where: { parent_id: c.id }, order: [['created_at', 'ASC']] });
    },
    createdAt: (c) => c.created_at,
    updatedAt: (c) => c.updated_at,
  },

  Notification: {
    publicId: (n) => n.public_id,
    isRead: (n) => n.is_read,
    readAt: (n) => n.read_at,
    createdAt: (n) => n.created_at,
  },

  AuditLog: {
    entityType: (a) => a.entity_type,
    entityId: (a) => a.entity_id,
    actor: (a, _args, ctx) => ctx.loaders.userById.load(a.actor_id),
    beforeState: (a) => a.before_state,
    afterState: (a) => a.after_state,
    createdAt: (a) => a.created_at,
  },
};

module.exports = resolvers;

