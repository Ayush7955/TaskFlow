const { Router } = require('express');
const authRoutes = require('./auth.routes');
const workspaceRoutes = require('./workspace.routes');
const boardRoutes = require('./board.routes');

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

module.exports = router;

