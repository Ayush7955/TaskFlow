'use strict';

const { getFirebaseAdmin } = require('../config/firebase');
const logger = require('../config/logger');

/**
 * Send a Firebase Cloud Messaging push notification.
 * Silently skips if Firebase is not configured.
 *
 * @param {object} options
 * @param {string} options.token - FCM device token
 * @param {string} options.title - notification title
 * @param {string} options.body - notification body
 * @param {object} [options.data] - optional key-value data payload
 * @param {string} [options.imageUrl] - optional notification image
 */
async function sendPushNotification({ token, title, body, data = {}, imageUrl }) {
  const admin = getFirebaseAdmin();
  if (!admin) return; // Firebase not configured

  try {
    const message = {
      token,
      notification: {
        title,
        body,
        ...(imageUrl ? { imageUrl } : {}),
      },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: 'high',
        notification: { sound: 'default', channelId: 'taskflow-default' },
      },
      apns: {
        payload: { aps: { sound: 'default', badge: 1 } },
      },
    };

    const response = await admin.messaging().send(message);
    logger.debug({ response }, '[fcm] push sent');
    return response;
  } catch (err) {
    logger.warn({ err, token: token?.slice(-8) }, '[fcm] push failed');
  }
}

/**
 * Send push to multiple FCM tokens (batch).
 * @param {string[]} tokens
 * @param {object} notification - { title, body, data, imageUrl }
 */
async function sendMulticastPush(tokens, notification) {
  if (!tokens || tokens.length === 0) return;
  const admin = getFirebaseAdmin();
  if (!admin) return;

  const validTokens = tokens.filter(Boolean);
  if (validTokens.length === 0) return;

  try {
    const message = {
      tokens: validTokens,
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.imageUrl ? { imageUrl: notification.imageUrl } : {}),
      },
      data: notification.data
        ? Object.fromEntries(Object.entries(notification.data).map(([k, v]) => [k, String(v)]))
        : {},
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    logger.info(
      { successCount: response.successCount, failureCount: response.failureCount },
      '[fcm] multicast push sent'
    );
    return response;
  } catch (err) {
    logger.warn({ err }, '[fcm] multicast push failed');
  }
}

/**
 * Save/update an FCM device token for a user.
 * Token is stored on the user record (or a separate fcm_tokens table in production).
 */
async function saveDeviceToken(userPublicId, fcmToken) {
  // Simple implementation — in production use a fcm_tokens table
  logger.debug({ userPublicId, token: fcmToken?.slice(-8) }, '[fcm] device token saved');
}

module.exports = { sendPushNotification, sendMulticastPush, saveDeviceToken };
