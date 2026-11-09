'use strict';

const cron = require('node-cron');
const { Op } = require('sequelize');
const { RefreshToken } = require('../models');
const logger = require('../config/logger');

/**
 * Purge Job
 * Runs daily at 02:00 UTC.
 * Cleans up expired/revoked refresh tokens older than 30 days.
 */
function startPurgeJob() {
  cron.schedule('0 2 * * *', async () => {
    logger.info('[job:purge] running');
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const deleted = await RefreshToken.destroy({
        where: {
          [Op.or]: [
            { expires_at: { [Op.lt]: new Date() } },
            { is_revoked: true, updated_at: { [Op.lt]: thirtyDaysAgo } },
          ],
        },
      });

      logger.info({ deleted }, '[job:purge] expired tokens cleaned up');
    } catch (err) {
      logger.error({ err }, '[job:purge] error');
    }
  });

  logger.info('[job:purge] scheduled — daily at 02:00 UTC');
}

module.exports = { startPurgeJob };
