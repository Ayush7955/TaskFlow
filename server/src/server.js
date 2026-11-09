require('dotenv').config();

const http = require('http');
const app = require('./app');
const { port, nodeEnv } = require('./config/env');
const logger = require('./config/logger');

let sequelizeInstance;

const getDb = () => {
  if (!sequelizeInstance) {
    // eslint-disable-next-line global-require
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

    server.listen(port, () => {
      logger.info(`🚀 TaskFlow API running on port ${port} in ${nodeEnv} mode`);
      logger.info(`   API: http://localhost:${port}/api/v1`);
      logger.info(`   Health: http://localhost:${port}/api/v1/health`);
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

