'use strict';

const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const { User, WorkspaceMember } = require('../models');
const logger = require('../config/logger');
const { EVENTS } = require('../constants/events');

/** @type {import('socket.io').Server} */
let io;

/**
 * Initialize Socket.io server on the HTTP server instance.
 * @param {import('http').Server} httpServer
 * @param {string[]} corsOrigins - allowed origins from config
 */
function initSocketIO(httpServer, corsOrigins) {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 min
      skipMiddlewares: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ─── Authentication middleware ─────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) return next(new Error('Authentication required'));

      const payload = verifyAccessToken(token);
      const user = await User.findOne({
        where: { public_id: payload.publicId, is_active: true },
        attributes: ['id', 'public_id', 'name', 'avatar_url', 'token_version'],
      });

      if (!user || user.token_version !== payload.tokenVersion) {
        return next(new Error('Invalid or expired token'));
      }

      socket.userId = user.id;
      socket.userPublicId = user.public_id;
      socket.userName = user.name;
      socket.userAvatarUrl = user.avatar_url;

      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  // ─── Connection handler ────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    logger.info({ userId: socket.userPublicId }, '[socket] client connected');

    // Register handlers
    require('./handlers/board.handler')(io, socket);
    require('./handlers/card.handler')(io, socket);
    require('./handlers/list.handler')(io, socket);
    require('./handlers/presence.handler')(io, socket);

    socket.on('disconnect', (reason) => {
      logger.info({ userId: socket.userPublicId, reason }, '[socket] client disconnected');
    });

    socket.on('error', (err) => {
      logger.error({ err, userId: socket.userPublicId }, '[socket] socket error');
    });
  });

  logger.info('[socket] Socket.io server initialized');
  return io;
}

/**
 * Get the Socket.io server instance.
 * @returns {import('socket.io').Server}
 */
function getIO() {
  if (!io) throw new Error('Socket.io not initialized — call initSocketIO first');
  return io;
}

module.exports = { initSocketIO, getIO };
