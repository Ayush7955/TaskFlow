const { Router } = require('express');
const authRoutes = require('./auth.routes');
const workspaceRoutes = require('./workspace.routes');
const boardRoutes = require('./board.routes');
const listRoutes = require('./list.routes');
const cardRoutes = require('./card.routes');
const checklistRoutes = require('./checklist.routes');
const labelRoutes = require('./label.routes');
const commentRoutes = require('./comment.routes');

const router = Router();

router.get('/health', async (_req, res) => {
  const { sequelize } = require('../models');
  let dbStatus = 'connected';
  try {
    await sequelize.authenticate();
  } catch {
    dbStatus = 'disconnected';
  }
  res.json({
    success: true,
    data: {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      dbStatus,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

router.get('/ready', (_req, res) => res.json({ success: true, data: { ready: true } }));

router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/boards', boardRoutes);

// Board sub-resources
router.use('/boards/:boardId/lists', listRoutes);
router.use('/boards/:boardId/labels', labelRoutes);
// Board full payload (lists + cards optimized)
router.use('/boards/:boardId/payload', (req, res, next) => {
  req.params.boardId = req.params.boardId;
  next();
}, require('../controllers/card.controller').getBoardPayload);

// List sub-resources
router.use('/lists/:listId/cards', (req, _res, next) => {
  // propagate listId into card routes
  next();
}, cardRoutes);

// Card sub-resources
router.use('/cards', cardRoutes);
router.use('/cards/:cardId/checklists', checklistRoutes);
router.use('/cards/:cardId/comments', commentRoutes);

module.exports = router;

