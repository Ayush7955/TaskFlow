'use strict';

const { firebase: cfg } = require('./env');
const logger = require('./logger');

let admin;

/**
 * Lazy-initialize Firebase Admin SDK.
 * Returns null if Firebase credentials are not configured.
 */
function getFirebaseAdmin() {
  if (admin) return admin;

  if (!cfg.projectId || !cfg.clientEmail || !cfg.privateKey) {
    logger.warn('[firebase] credentials not configured — FCM push disabled');
    return null;
  }

  try {
    const firebaseAdmin = require('firebase-admin');
    admin = firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert({
        projectId: cfg.projectId,
        clientEmail: cfg.clientEmail,
        privateKey: cfg.privateKey.replace(/\\n/g, '\n'),
      }),
      databaseURL: cfg.databaseUrl || undefined,
    });
    logger.info('[firebase] Admin SDK initialized');
    return admin;
  } catch (err) {
    logger.error({ err }, '[firebase] Admin SDK init failed');
    return null;
  }
}

module.exports = { getFirebaseAdmin };

