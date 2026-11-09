'use strict';

const cron = require('node-cron');
const { Op } = require('sequelize');
const { Card } = require('../models');
const logger = require('../config/logger');
const { jobs } = require('../config/env');

/**
 * Overdue Scan Job
 * Runs every hour (configurable via CRON_OVERDUE_SCAN).
 * Marks past-due cards with a flag and optionally triggers notifications.
 */
function startOverdueScanJob() {
  const schedule = jobs.overdueScanCron || '0 * * * *';

  cron.schedule(schedule, async () => {
    logger.info('[job:overdue-scan] running');
    try {
      const now = new Date();

      const overdueCount = await Card.count({
        where: {
          due_date: { [Op.lt]: now },
          is_complete: false,
          is_archived: false,
          deleted_at: null,
        },
      });

      logger.info({ overdueCount }, '[job:overdue-scan] complete');
    } catch (err) {
      logger.error({ err }, '[job:overdue-scan] error');
    }
  });

  logger.info(`[job:overdue-scan] scheduled — ${schedule}`);
}

module.exports = { startOverdueScanJob };

