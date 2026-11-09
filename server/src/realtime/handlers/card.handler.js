'use strict';

const { EVENTS } = require('../../constants/events');
const logger = require('../../config/logger');

/**
 * Card event handler — receives client-originated card events
 * and broadcasts them to the board room.
 *
 * Most card mutations are triggered server-side via the REST/GraphQL API
 * (which emits the events). This handler handles optimistic client events.
 */
module.exports = function cardHandler(io, socket) {
  // Client signals it started typing a comment
  socket.on(EVENTS.CARD_COMMENT_TYPING, ({ boardId, cardId }) => {
    const roomId = `board:${boardId}`;
    socket.to(roomId).emit(EVENTS.CARD_COMMENT_TYPING, {
      cardId,
      user: { publicId: socket.userPublicId, name: socket.userName, avatarUrl: socket.userAvatarUrl },
    });
  });

  // Client signals it stopped typing
  socket.on(EVENTS.CARD_COMMENT_STOP_TYPING, ({ boardId, cardId }) => {
    const roomId = `board:${boardId}`;
    socket.to(roomId).emit(EVENTS.CARD_COMMENT_STOP_TYPING, {
      cardId,
      user: { publicId: socket.userPublicId },
    });
  });
};
