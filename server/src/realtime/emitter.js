'use strict';

const { getIO } = require('./index');
const { EVENTS } = require('../constants/events');

/**
 * Emit a Socket.io event to all clients in a board room.
 * Always called AFTER DB commit — never inside a transaction.
 *
 * @param {string} boardPublicId - board's public UUID
 * @param {string} event - event name from EVENTS constants
 * @param {object} payload - JSON-serializable payload
 * @param {string} [excludeSocketId] - socket.id to exclude from broadcast
 */
function emitToBoard(boardPublicId, event, payload, excludeSocketId) {
  const roomId = `board:${boardPublicId}`;
  try {
    const io = getIO();
    if (excludeSocketId) {
      io.to(roomId).except(excludeSocketId).emit(event, payload);
    } else {
      io.to(roomId).emit(event, payload);
    }
  } catch {
    // Socket.io not initialized (e.g., during tests) — silently skip
  }
}

/**
 * Emit to a specific user (across all their connections).
 * @param {string} userPublicId
 * @param {string} event
 * @param {object} payload
 */
function emitToUser(userPublicId, event, payload) {
  const roomId = `user:${userPublicId}`;
  try {
    const io = getIO();
    io.to(roomId).emit(event, payload);
  } catch {
    // ignore
  }
}

/**
 * Emit to a workspace (all members).
 * @param {string} workspacePublicId
 * @param {string} event
 * @param {object} payload
 */
function emitToWorkspace(workspacePublicId, event, payload) {
  const roomId = `workspace:${workspacePublicId}`;
  try {
    const io = getIO();
    io.to(roomId).emit(event, payload);
  } catch {
    // ignore
  }
}

module.exports = { emitToBoard, emitToUser, emitToWorkspace };
