'use strict';
require('dotenv').config();

const { createConsumer } = require('@aveon/shared');
const { sendMail } = require('./email/mailer');
const { inviteTemplate, pollOpenedTemplate, pollClosedTemplate, FROM } = require('./email/templates');

const TOPIC = 'aveon.events';
const GROUP_ID = 'email-workers';

// ── Event handlers ────────────────────────────────────────────────────────────

/**
 * Handle INVITE_REQUESTED: send registration email to the invitee.
 */
const handleInviteRequested = async (event) => {
  const { email, name, registrationLink, expiresAt } = event;
  if (!email) return console.warn('[Email Worker] INVITE_REQUESTED missing email, skipping.');

  const { subject, html, text } = inviteTemplate({ name, registrationLink, expiresAt });
  await sendMail({ from: FROM(), to: email, subject, html, text });
};

/**
 * Handle POLL_OPENED: send notification to all members.
 * In a real system you'd fetch members from DB; here we log the event
 * and send to NOTIFY_ALL_EMAIL if configured (e.g. a club mailing list).
 */
const handlePollOpened = async (event) => {
  const { pollId, title, description } = event;
  const notifyAll = process.env.NOTIFY_ALL_EMAIL;
  if (!notifyAll) {
    console.log(`[Email Worker] POLL_OPENED "${title}" — no NOTIFY_ALL_EMAIL set, skipping bulk send.`);
    return;
  }
  const { subject, html, text } = pollOpenedTemplate({ title, description, pollId });
  await sendMail({ from: FROM(), to: notifyAll, subject, html, text });
};

/**
 * Handle POLL_CLOSED: send results notification.
 */
const handlePollClosed = async (event) => {
  const { pollId, title } = event;
  const notifyAll = process.env.NOTIFY_ALL_EMAIL;
  if (!notifyAll) {
    console.log(`[Email Worker] POLL_CLOSED "${title}" — no NOTIFY_ALL_EMAIL set, skipping bulk send.`);
    return;
  }
  const { subject, html, text } = pollClosedTemplate({ title, pollId });
  await sendMail({ from: FROM(), to: notifyAll, subject, html, text });
};

// ── Event router ──────────────────────────────────────────────────────────────
const EVENT_HANDLERS = {
  INVITE_REQUESTED: handleInviteRequested,
  POLL_OPENED: handlePollOpened,
  POLL_CLOSED: handlePollClosed,
};

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const run = async () => {
  console.log('[Email Worker] Starting up...');

  const consumer = await createConsumer('notification-service', GROUP_ID);
  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });

  console.log(`[Email Worker] Listening on topic "${TOPIC}" (group: ${GROUP_ID})`);
  console.log(`[Email Worker] Rate limits — max ${process.env.EMAIL_RATE_PER_SECOND || 1}/sec, ${process.env.EMAIL_RATE_PER_MINUTE || 10}/min`);

  await consumer.run({
    eachMessage: async ({ message }) => {
      let event;
      try {
        event = JSON.parse(message.value.toString());
      } catch {
        console.error('[Email Worker] Failed to parse message:', message.value.toString());
        return;
      }

      const { type, ...payload } = event;
      console.log(`[Email Worker] Received event: ${type}`);

      const handler = EVENT_HANDLERS[type];
      if (!handler) {
        console.log(`[Email Worker] No handler for event type "${type}" — ignoring.`);
        return;
      }

      try {
        await handler(payload);
      } catch (err) {
        console.error(`[Email Worker] Error handling ${type}:`, err.message);
      }
    },
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`[Email Worker] ${signal} received — shutting down gracefully...`);
    await consumer.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

run().catch((err) => {
  console.error('[Email Worker] Fatal startup error:', err);
  process.exit(1);
});
