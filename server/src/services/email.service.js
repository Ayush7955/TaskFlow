'use strict';

const path = require('path');
const fs = require('fs');
const Handlebars = require('handlebars');
const { getTransporter } = require('../config/mailer');
const { mail, clientUrl } = require('../config/env');
const logger = require('../config/logger');

const TEMPLATE_DIR = path.join(__dirname, '../templates/email');
const templateCache = new Map();

// Register Handlebars helpers
Handlebars.registerHelper('formatDate', (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
});

/**
 * Compile and cache a Handlebars template.
 */
function getTemplate(name) {
  if (templateCache.has(name)) return templateCache.get(name);
  const filePath = path.join(TEMPLATE_DIR, `${name}.hbs`);
  const source = fs.readFileSync(filePath, 'utf8');
  const tmpl = Handlebars.compile(source);
  templateCache.set(name, tmpl);
  return tmpl;
}

/**
 * Render HTML email using layout + template.
 */
function renderEmail(templateName, data) {
  const layoutTemplate = getTemplate('layout');
  const bodyTemplate = getTemplate(templateName);
  const body = bodyTemplate({ ...data, appUrl: clientUrl });
  return layoutTemplate({ body, appUrl: clientUrl });
}

/**
 * Send an email.
 * @param {object} options
 * @param {string} options.to - recipient email
 * @param {string} options.subject - email subject
 * @param {string} options.template - template name (without .hbs)
 * @param {object} options.data - template data
 */
async function sendEmail({ to, subject, template, data }) {
  try {
    const html = renderEmail(template, data);
    const transporter = getTransporter();

    await transporter.sendMail({
      from: mail.from,
      to,
      subject,
      html,
    });

    logger.info({ to, subject, template }, '[email] sent successfully');
  } catch (err) {
    // Log but never throw — email failures shouldn't block API responses
    logger.error({ err, to, subject, template }, '[email] send failed');
  }
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

async function sendVerificationEmail(user, token) {
  const verifyUrl = `${clientUrl}/verify-email?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your TaskFlow email address',
    template: 'verify-email',
    data: { name: user.name, verifyUrl },
  });
}

async function sendPasswordResetEmail(user, token) {
  const resetUrl = `${clientUrl}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset your TaskFlow password',
    template: 'reset-password',
    data: { name: user.name, resetUrl },
  });
}

async function sendWorkspaceInviteEmail({ email, inviterName, workspaceName, role, token }) {
  const acceptUrl = `${clientUrl}/invites/${token}/accept`;
  await sendEmail({
    to: email,
    subject: `${inviterName} invited you to ${workspaceName} on TaskFlow`,
    template: 'workspace-invite',
    data: { inviterName, workspaceName, role, acceptUrl },
  });
}

async function sendDueDateReminderEmail(user, card, board, hoursUntilDue) {
  const cardUrl = `${clientUrl}/boards/${board.public_id}/cards/${card.public_id}`;
  await sendEmail({
    to: user.email,
    subject: `Due soon: ${card.title}`,
    template: 'due-date-reminder',
    data: {
      name: user.name,
      cardTitle: card.title,
      boardName: board.name,
      dueDate: card.due_date,
      priority: card.priority,
      hoursUntilDue,
      cardUrl,
    },
  });
}

async function sendNewCommentEmail(user, card, comment, author) {
  const cardUrl = `${clientUrl}/boards/${card.board_id}/cards/${card.public_id}`;
  await sendEmail({
    to: user.email,
    subject: `New comment on "${card.title}"`,
    template: 'new-comment',
    data: {
      name: user.name,
      cardTitle: card.title,
      authorName: author.name,
      commentBody: comment.content,
      cardUrl,
    },
  });
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWorkspaceInviteEmail,
  sendDueDateReminderEmail,
  sendNewCommentEmail,
};
