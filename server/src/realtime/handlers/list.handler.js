'use strict';

const { EVENTS } = require('../../constants/events');

/**
 * List event handler — receives client drag events for optimistic UI.
 * Actual position updates are committed via REST API, then emitted to board.
 */
module.exports = function listHandler(io, socket) {
  // Client is dragging a card (optimistic broadcast to room)
  socket.on(EVENTS.CARD_DRAG_START, ({ boardId, cardId }) => {
    socket.to(`board:${boardId}`).emit(EVENTS.CARD_DRAG_START, {
      cardId,
      user: { publicId: socket.userPublicId, name: socket.userName },
    });
  });

  socket.on(EVENTS.CARD_DRAG_END, ({ boardId, cardId }) => {
    socket.to(`board:${boardId}`).emit(EVENTS.CARD_DRAG_END, { cardId });
  });
};

