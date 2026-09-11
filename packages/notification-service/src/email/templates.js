'use strict';

const FRONTEND_URL = () => process.env.FRONTEND_URL || 'http://localhost:5173';
const FROM = () => `"AVEON Polling" <${process.env.GMAIL_USER}>`;

// ── Shared styles ────────────────────────────────────────────────────────────
const baseStyle = `
  font-family: 'Segoe UI', Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  color: #1a1a2e;
`;

const buttonStyle = `
  display: inline-block;
  padding: 14px 28px;
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  color: #ffffff;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 15px;
  margin: 20px 0;
  box-shadow: 0 4px 14px rgba(79,70,229,0.35);
`;

const cardStyle = `
  background: #f8f9ff;
  border-radius: 12px;
  padding: 32px;
  border: 1px solid #e5e7eb;
`;

const headerStyle = `
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  border-radius: 12px 12px 0 0;
  padding: 28px 32px;
  text-align: center;
`;

// ── Template builders ────────────────────────────────────────────────────────

/**
 * Invite email (INVITE_REQUESTED)
 */
const inviteTemplate = ({ name, registrationLink, expiresAt }) => {
    const expiry = new Date(expiresAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    return {
        subject: '🗳️ You\'ve been invited to AVEON Polling',
        html: `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;">AVEON Polling</h1>
          <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">You have a new invitation</p>
        </div>
        <div style="${cardStyle} border-radius:0 0 12px 12px;">
          <h2 style="margin-top:0;">Hello, ${name}! 👋</h2>
          <p>You've been invited to join the <strong>AVEON Polling</strong> platform — a secure, member-only voting system.</p>
          <p>Click the button below to create your account. This link expires on <strong>${expiry}</strong>.</p>
          <div style="text-align:center;">
            <a href="${registrationLink}" style="${buttonStyle}">Create My Account →</a>
          </div>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
          <p style="color:#6b7280;font-size:13px;margin:0;">
            If you expected a different link, copy this URL:<br/>
            <a href="${registrationLink}" style="color:#4F46E5;word-break:break-all;">${registrationLink}</a>
          </p>
          <p style="color:#9ca3af;font-size:12px;margin-top:16px;">
            If you did not expect this invitation, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
        text: `Hello ${name},\n\nYou've been invited to AVEON Polling.\n\nCreate your account here (expires ${expiry}):\n${registrationLink}\n\nIf you did not expect this, ignore this email.`,
    };
};

/**
 * Poll opened email (POLL_OPENED)
 */
const pollOpenedTemplate = ({ title, description, pollId }) => {
    const pollLink = `${FRONTEND_URL()}/polls/${pollId}`;
    return {
        subject: `🗳️ New Poll Open: "${title}"`,
        html: `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;">AVEON Polling</h1>
          <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">A new poll is now open</p>
        </div>
        <div style="${cardStyle} border-radius:0 0 12px 12px;">
          <h2 style="margin-top:0;color:#4F46E5;">📢 "${title}" is now open!</h2>
          ${description ? `<p>${description}</p>` : ''}
          <p>Cast your vote now — every voice counts.</p>
          <div style="text-align:center;">
            <a href="${pollLink}" style="${buttonStyle}">Vote Now →</a>
          </div>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
          <p style="color:#9ca3af;font-size:12px;">
            You received this because you are a member of AVEON Polling.
          </p>
        </div>
      </div>
    `,
        text: `A new poll is open: "${title}"\n\n${description || ''}\n\nVote here: ${pollLink}`,
    };
};

/**
 * Poll closed email (POLL_CLOSED)
 */
const pollClosedTemplate = ({ title, pollId }) => {
    const resultsLink = `${FRONTEND_URL()}/polls/${pollId}`;
    return {
        subject: `🔒 Poll Closed: "${title}" — Results Available`,
        html: `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;">AVEON Polling</h1>
          <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Poll results are in</p>
        </div>
        <div style="${cardStyle} border-radius:0 0 12px 12px;">
          <h2 style="margin-top:0;color:#7C3AED;">🏁 "${title}" has closed</h2>
          <p>Voting is complete. Check out the results to see who won!</p>
          <div style="text-align:center;">
            <a href="${resultsLink}" style="${buttonStyle}">View Results →</a>
          </div>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
          <p style="color:#9ca3af;font-size:12px;">
            You received this because you are a member of AVEON Polling.
          </p>
        </div>
      </div>
    `,
        text: `The poll "${title}" has closed. See results: ${resultsLink}`,
    };
};

module.exports = { inviteTemplate, pollOpenedTemplate, pollClosedTemplate, FROM };
