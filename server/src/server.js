require('dotenv').config();

const http = require('http');
const app = require('./app');
const { port, nodeEnv, corsOrigins } = require('./config/env');
const logger = require('./config/logger');
const { initSocketIO } = require('./realtime');
const { startDueDateReminderJob } = require('./jobs/dueDateReminder.job');
const { startOverdueScanJob } = require('./jobs/overdueScan.job');
const { startPurgeJob } = require('./jobs/purge.job');

let sequelizeInstance;

const getDb = () => {
  if (!sequelizeInstance) {
    sequelizeInstance = require('./models').sequelize;
  }
  return sequelizeInstance;
};

const server = http.createServer(app);

const start = async () => {
  try {
    const db = getDb();
    await db.authenticate();
    logger.info('✅ Database connection established');

    // Initialize Socket.io on the HTTP server
    const io = initSocketIO(server, corsOrigins);

    // Initialize GraphQL (async — needs Apollo Server to start)
    await app.initGraphQL();

    // Start background cron jobs (skip in test env)
    if (nodeEnv !== 'test') {
      startDueDateReminderJob();
      startOverdueScanJob();
      startPurgeJob();
    }

    server.listen(port, () => {
      logger.info(`🚀 TaskFlow API running on port ${port} in ${nodeEnv} mode`);
      logger.info(`   REST API:  http://localhost:${port}/api/v1`);
      logger.info(`   GraphQL:   http://localhost:${port}/graphql`);
      logger.info(`   Health:    http://localhost:${port}/api/v1/health`);
      logger.info(`   WebSocket: ws://localhost:${port}`);
    });
  } catch (err) {
    logger.error({ err }, '❌ Failed to start server');
    process.exit(1);
  }
};

const shutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      const db = getDb();
      await db.close();
      logger.info('Database pool closed');
    } catch (err) {
      logger.error({ err }, 'Error closing database pool');
    }
    logger.info('✅ Server shut down cleanly');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.warn('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled promise rejection');
  process.exit(1);
});

start();
