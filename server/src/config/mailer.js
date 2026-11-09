'use strict';

const nodemailer = require('nodemailer');
const { mail } = require('./env');
const logger = require('./logger');

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: mail.host,
      port: mail.port,
      secure: mail.port === 465,
      auth: mail.user && mail.pass
        ? { user: mail.user, pass: mail.pass }
        : undefined,
    });

    transporter.verify((err) => {
      if (err) {
        logger.warn({ err }, '[mailer] SMTP connection failed — emails will be queued/skipped');
      } else {
        logger.info('[mailer] SMTP connection established');
      }
    });
  }
  return transporter;
}

module.exports = { getTransporter };

