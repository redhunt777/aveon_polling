const nodemailer = require('nodemailer');

const createTransporter = () =>
    nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

/**
 * Send an invite email with a registration link.
 * @param {{ toEmail: string, toName: string, token: string }} opts
 */
const sendInviteEmail = async ({ toEmail, toName, token }) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const registrationLink = `${frontendUrl}/register?token=${token}`;

    const transporter = createTransporter();

    await transporter.sendMail({
        from: `"AVEON Polling" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: 'You have been invited to AVEON Polling',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hello, ${toName}!</h2>
        <p>You have been invited to join the AVEON Polling platform.</p>
        <p>Click the button below to create your account. This link expires in <strong>72 hours</strong>.</p>
        <a
          href="${registrationLink}"
          style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #4F46E5;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 16px 0;
          "
        >
          Create Account
        </a>
        <p style="color: #666; font-size: 12px;">
          If you did not expect this invitation, you can safely ignore this email.<br/>
          Or copy this link: ${registrationLink}
        </p>
      </div>
    `,
        text: `Hello ${toName},\n\nYou have been invited to AVEON Polling.\n\nCreate your account here (expires in 72 hours):\n${registrationLink}\n\nIf you did not expect this invitation, ignore this email.`,
    });
};

module.exports = { sendInviteEmail };
