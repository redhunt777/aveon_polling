require('dotenv').config();
const Redis = require('ioredis');
const nodemailer = require('nodemailer');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redisSubscriber = new Redis(REDIS_URL);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

console.log('[Notification Service] Initialized and connecting to Redis...');

redisSubscriber.subscribe('poll:events', (err, count) => {
  if (err) {
    console.error('[Notification Service] Redis subscription error:', err.message);
  } else {
    console.log(`[Notification Service] Subscribed to ${count} Redis channels.`);
  }
});

redisSubscriber.on('message', async (channel, message) => {
  try {
    const event = JSON.parse(message);
    console.log(`[Notification Service] Received event on channel '${channel}':`, event);

    if (event.type === 'POLL_OPENED') {
      console.log(`[Email Alert] Poll "${event.title}" is now open for voting.`);
    } else if (event.type === 'POLL_CLOSED') {
      console.log(`[Email Alert] Poll "${event.title}" has closed. Check results!`);
    }
  } catch (err) {
    console.error('[Notification Service] Error processing message:', err.message);
  }
});
