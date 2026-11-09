'use strict';

const { EVENTS } = require('../../constants/events');
const logger = require('../../config/logger');

// In-memory presence map: boardId → Set of { userPublicId, name, avatarUrl, socketId }
// In production, replace with Redis for multi-instance support.
const presenceMap = new Map();

/**
 * Presence handler — tracks who is online viewing each board.
 */
module.exports = function presenceHandler(io, socket) {
  let currentBoardId = null;

  /**
   * When a user joins a board room, add them to presence.
   * Piggyback on board:join event already emitted.
   */
  socket.on(EVENTS.BOARD_JOINED, ({ boardId }) => {
    currentBoardId = boardId;
    if (!presenceMap.has(boardId)) presenceMap.set(boardId, new Map());

    presenceMap.get(boardId).set(socket.id, {
      userPublicId: socket.userPublicId,
      name: socket.userName,
      avatarUrl: socket.userAvatarUrl,
      socketId: socket.id,
    });

    // Broadcast updated presence to all board members
    _broadcastPresence(io, boardId);
    logger.debug({ userId: socket.userPublicId, boardId }, '[presence] user entered board');
  });

  socket.on(EVENTS.BOARD_LEFT, ({ boardId }) => {
    _removePresence(boardId, socket.id);
    _broadcastPresence(io, boardId);
    currentBoardId = null;
  });

  socket.on('disconnect', () => {
    if (currentBoardId) {
      _removePresence(currentBoardId, socket.id);
      _broadcastPresence(io, currentBoardId);
    }
  });
};

function _removePresence(boardId, socketId) {
  if (!presenceMap.has(boardId)) return;
  presenceMap.get(boardId).delete(socketId);
  if (presenceMap.get(boardId).size === 0) presenceMap.delete(boardId);
}

function _broadcastPresence(io, boardId) {
  const members = presenceMap.has(boardId)
    ? Array.from(presenceMap.get(boardId).values()).map(({ userPublicId, name, avatarUrl }) => ({
        userPublicId,
        name,
        avatarUrl,
      }))
    : [];

  // Deduplicate by userPublicId (same user, multiple tabs)
  const seen = new Set();
  const unique = members.filter((m) => {
    if (seen.has(m.userPublicId)) return false;
    seen.add(m.userPublicId);
    return true;
  });

  io.to(`board:${boardId}`).emit(EVENTS.PRESENCE_UPDATE, { boardId, members: unique });
}

