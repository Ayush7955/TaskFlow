'use strict';

const { Board, WorkspaceMember } = require('../../models');
const { EVENTS } = require('../../constants/events');
const logger = require('../../config/logger');

/**
 * Board room handler — join/leave board rooms, enforce membership.
 */
module.exports = function boardHandler(io, socket) {
  /**
   * Client joins a board room.
   * event: 'board:join'  payload: { boardId: 'public-uuid' }
   */
  socket.on(EVENTS.BOARD_JOIN, async ({ boardId }) => {
    try {
      const board = await Board.findOne({ where: { public_id: boardId, deleted_at: null } });
      if (!board) return socket.emit(EVENTS.ERROR, { message: 'Board not found' });

      const membership = await WorkspaceMember.findOne({
        where: { workspace_id: board.workspace_id, user_id: socket.userId },
      });
      if (!membership) return socket.emit(EVENTS.ERROR, { message: 'Not a workspace member' });

      const roomId = `board:${boardId}`;
      await socket.join(roomId);

      // Also join personal room for notifications
      await socket.join(`user:${socket.userPublicId}`);
      // Join workspace room
      await socket.join(`workspace:${board.workspace_id}`);

      socket.emit(EVENTS.BOARD_JOINED, { boardId, message: 'Joined board room' });
      logger.debug({ userId: socket.userPublicId, boardId }, '[socket] joined board room');
    } catch (err) {
      logger.error({ err }, '[socket] board:join error');
      socket.emit(EVENTS.ERROR, { message: 'Failed to join board' });
    }
  });

  /**
   * Client leaves a board room.
   * event: 'board:leave'  payload: { boardId: 'public-uuid' }
   */
  socket.on(EVENTS.BOARD_LEAVE, async ({ boardId }) => {
    const roomId = `board:${boardId}`;
    await socket.leave(roomId);
    socket.emit(EVENTS.BOARD_LEFT, { boardId });
    logger.debug({ userId: socket.userPublicId, boardId }, '[socket] left board room');
  });
};

