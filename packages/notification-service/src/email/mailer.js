'use strict';
const nodemailer = require('nodemailer');
const Bottleneck = require('bottleneck');

// ── Nodemailer transporter ──────────────────────────────────────────────────
const createTransporter = () =>
    nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

// ── Bottleneck rate limiter ─────────────────────────────────────────────────
// Defaults: 1 email/sec, 10 emails/min — overridable via env
const ratePerSecond = parseInt(process.env.EMAIL_RATE_PER_SECOND || '1', 10);
const ratePerMinute = parseInt(process.env.EMAIL_RATE_PER_MINUTE || '10', 10);

const limiter = new Bottleneck({
    minTime: Math.ceil(1000 / ratePerSecond),     // min ms between jobs
    reservoir: ratePerMinute,                      // max jobs in reservoir window
    reservoirRefreshInterval: 60 * 1000,           // refill every 60 seconds
    reservoirRefreshAmount: ratePerMinute,         // refill to this amount
});

limiter.on('depleted', () => {
    console.warn('[Email Worker] Rate limit reservoir depleted — emails queued, will retry when refilled.');
});

/**
 * Rate-limited sendMail wrapper.
 * @param {import('nodemailer').SendMailOptions} mailOptions
 */
const sendMail = (mailOptions) =>
    limiter.schedule(async () => {
        const queued = limiter.queued();
        const reservoir = await limiter.currentReservoir();
        console.log(
            `[Email Worker] Dispatching to ${mailOptions.to} | queued: ${queued} | reservoir: ${reservoir}`
        );
        const transporter = createTransporter();
        await transporter.sendMail(mailOptions);
        console.log(`[Email Worker] ✓ Email sent to ${mailOptions.to}`);
    });

module.exports = { sendMail };
