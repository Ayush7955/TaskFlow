'use strict';

const DataLoader = require('dataloader');
const { User, Board, List, Card, Checklist, ChecklistItem, Label, Comment, Attachment, WorkspaceMember } = require('../models');

/**
 * Create all DataLoaders for a single request context.
 * Each loader batches DB calls within a single tick.
 */
function createLoaders() {
  return {
    // User by internal ID
    userById: new DataLoader(async (ids) => {
      const users = await User.findAll({ where: { id: ids } });
      const map = new Map(users.map((u) => [u.id, u]));
      return ids.map((id) => map.get(id) || null);
    }),

    // User by public_id
    userByPublicId: new DataLoader(async (publicIds) => {
      const users = await User.findAll({ where: { public_id: publicIds } });
      const map = new Map(users.map((u) => [u.public_id, u]));
      return publicIds.map((pid) => map.get(pid) || null);
    }),

    // Board by internal ID
    boardById: new DataLoader(async (ids) => {
      const boards = await Board.findAll({ where: { id: ids } });
      const map = new Map(boards.map((b) => [b.id, b]));
      return ids.map((id) => map.get(id) || null);
    }),

    // Lists by board_id (batch: array of board_ids → array of arrays of lists)
    listsByBoardId: new DataLoader(async (boardIds) => {
      const lists = await List.findAll({
        where: { board_id: boardIds, is_archived: false, deleted_at: null },
        order: [['position', 'ASC']],
      });
      const map = new Map(boardIds.map((id) => [id, []]));
      for (const list of lists) {
        if (map.has(list.board_id)) map.get(list.board_id).push(list);
      }
      return boardIds.map((id) => map.get(id) || []);
    }),

    // Cards by list_id
    cardsByListId: new DataLoader(async (listIds) => {
      const cards = await Card.findAll({
        where: { list_id: listIds, is_archived: false, deleted_at: null },
        order: [['position', 'ASC']],
      });
      const map = new Map(listIds.map((id) => [id, []]));
      for (const card of cards) {
        if (map.has(card.list_id)) map.get(card.list_id).push(card);
      }
      return listIds.map((id) => map.get(id) || []);
    }),

    // Checklists by card_id
    checklistsByCardId: new DataLoader(async (cardIds) => {
      const cls = await Checklist.findAll({
        where: { card_id: cardIds },
        order: [['position', 'ASC']],
      });
      const map = new Map(cardIds.map((id) => [id, []]));
      for (const cl of cls) {
        if (map.has(cl.card_id)) map.get(cl.card_id).push(cl);
      }
      return cardIds.map((id) => map.get(id) || []);
    }),

    // Checklist items by checklist_id
    itemsByChecklistId: new DataLoader(async (checklistIds) => {
      const items = await ChecklistItem.findAll({
        where: { checklist_id: checklistIds },
        order: [['position', 'ASC']],
      });
      const map = new Map(checklistIds.map((id) => [id, []]));
      for (const item of items) {
        if (map.has(item.checklist_id)) map.get(item.checklist_id).push(item);
      }
      return checklistIds.map((id) => map.get(id) || []);
    }),

    // Labels by board_id
    labelsByBoardId: new DataLoader(async (boardIds) => {
      const labels = await Label.findAll({
        where: { board_id: boardIds },
        order: [['name', 'ASC']],
      });
      const map = new Map(boardIds.map((id) => [id, []]));
      for (const label of labels) {
        if (map.has(label.board_id)) map.get(label.board_id).push(label);
      }
      return boardIds.map((id) => map.get(id) || []);
    }),

    // Comments (top-level) by card_id
    commentsByCardId: new DataLoader(async (cardIds) => {
      const comments = await Comment.findAll({
        where: { card_id: cardIds, parent_id: null },
        order: [['created_at', 'ASC']],
      });
      const map = new Map(cardIds.map((id) => [id, []]));
      for (const c of comments) {
        if (map.has(c.card_id)) map.get(c.card_id).push(c);
      }
      return cardIds.map((id) => map.get(id) || []);
    }),

    // Attachments by card_id
    attachmentsByCardId: new DataLoader(async (cardIds) => {
      const attachments = await Attachment.findAll({
        where: { card_id: cardIds },
        order: [['created_at', 'DESC']],
      });
      const map = new Map(cardIds.map((id) => [id, []]));
      for (const a of attachments) {
        if (map.has(a.card_id)) map.get(a.card_id).push(a);
      }
      return cardIds.map((id) => map.get(id) || []);
    }),

    // Card assignees by card_id (via CardMember pivot)
    assigneesByCardId: new DataLoader(async (cardIds) => {
      const { CardMember } = require('../models');
      const pivots = await CardMember.findAll({
        where: { card_id: cardIds },
        include: [{ model: User, as: 'user', attributes: ['id', 'public_id', 'name', 'avatar_url', 'email'] }],
      });
      const map = new Map(cardIds.map((id) => [id, []]));
      for (const pivot of pivots) {
        if (map.has(pivot.card_id) && pivot.user) {
          map.get(pivot.card_id).push(pivot.user);
        }
      }
      return cardIds.map((id) => map.get(id) || []);
    }),

    // Card labels by card_id (via CardLabel pivot)
    labelsByCardId: new DataLoader(async (cardIds) => {
      const { CardLabel } = require('../models');
      const pivots = await CardLabel.findAll({
        where: { card_id: cardIds },
        include: [{ model: Label, as: 'label', attributes: ['id', 'public_id', 'name', 'color'] }],
      });
      const map = new Map(cardIds.map((id) => [id, []]));
      for (const pivot of pivots) {
        if (map.has(pivot.card_id) && pivot.label) {
          map.get(pivot.card_id).push(pivot.label);
        }
      }
      return cardIds.map((id) => map.get(id) || []);
    }),
  };
}

module.exports = createLoaders;

