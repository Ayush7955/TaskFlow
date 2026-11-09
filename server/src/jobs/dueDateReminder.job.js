'use strict';

const cron = require('node-cron');
const { Op } = require('sequelize');
const { Card, CardMember, User, Board, List } = require('../models');
const { sendDueDateReminderEmail } = require('../services/email.service');
const logger = require('../config/logger');
const { jobs } = require('../config/env');

/**
 * Due Date Reminder Job
 * Runs every 15 minutes (configurable via CRON_DUE_REMINDER).
 * Finds all non-complete cards due within DUE_REMINDER_HOURS_BEFORE hours
 * and sends reminder emails to assignees who haven't been notified yet.
 */
function startDueDateReminderJob() {
  const schedule = jobs.dueDateReminderCron || '*/15 * * * *';
  const hoursBefore = jobs.dueReminderHoursBefore || 24;

  cron.schedule(schedule, async () => {
    logger.info('[job:due-reminder] running');
    try {
      const now = new Date();
      const cutoff = new Date(now.getTime() + hoursBefore * 60 * 60 * 1000);

      const cards = await Card.findAll({
        where: {
          due_date: { [Op.between]: [now, cutoff] },
          is_complete: false,
          is_archived: false,
          deleted_at: null,
        },
        include: [
          {
            model: User,
            as: 'assignees',
            through: { attributes: [] },
            attributes: ['id', 'name', 'email'],
          },
          {
            model: List,
            as: 'list',
            include: [{ model: Board, as: 'board', attributes: ['id', 'public_id', 'name'] }],
          },
        ],
      });

      let emailsSent = 0;
      for (const card of cards) {
        const board = card.list?.board;
        if (!board) continue;

        const hoursUntilDue = Math.round((new Date(card.due_date) - now) / (60 * 60 * 1000));

        for (const assignee of card.assignees) {
          try {
            await sendDueDateReminderEmail(assignee, card, board, hoursUntilDue);
            emailsSent++;
          } catch (err) {
            logger.warn({ err, cardId: card.id, userId: assignee.id }, '[job:due-reminder] email failed');
          }
        }
      }

      logger.info({ cardsChecked: cards.length, emailsSent }, '[job:due-reminder] complete');
    } catch (err) {
      logger.error({ err }, '[job:due-reminder] error');
    }
  });

  logger.info(`[job:due-reminder] scheduled — ${schedule}`);
}

module.exports = { startDueDateReminderJob };

