const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const env = require("../lib/env");
const logger = require("./logger");
const { emailTemplates } = require("../templates/emailTemplates");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strip CR/LF and quote characters from values that get embedded in email
 * headers (to, subject, etc.) to prevent header injection attacks.
 */
function sanitizeHeaderValue(value) {
  return String(value ?? "")
    .replace(/[\r\n]/g, "")
    .replace(/"/g, "")
    .trim();
}

function buildSafeToHeader(name, email) {
  const safeName = sanitizeHeaderValue(name);
  const safeEmail = sanitizeHeaderValue(email);
  return safeName ? `"${safeName}" <${safeEmail}>` : safeEmail;
}

// ---------------------------------------------------------------------------
// Transport config validation
// ---------------------------------------------------------------------------

const requiredSmtpVars = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"];
const missingVars = requiredSmtpVars.filter((key) => !env[key]);

if (missingVars.length > 0) {
  logger.error(
    `SMTP config incomplete — missing env vars: ${missingVars.join(", ")}. Email sending will fail.`
  );
}

const smtpPort = parseInt(env.SMTP_PORT, 10);
const smtpSecure = env.SMTP_SECURE === "true";

// Port 465 requires secure:true (implicit TLS). Port 587/25 requires
// secure:false (STARTTLS). A mismatch here is the #1 cause of
// ECONNREFUSED / handshake failures with most SMTP providers.
if (smtpPort === 465 && !smtpSecure) {
  logger.error(
    "SMTP_PORT is 465 but SMTP_SECURE is not 'true'. Port 465 requires implicit TLS — set SMTP_SECURE=true."
  );
}
if (smtpPort === 587 && smtpSecure) {
  logger.error(
    "SMTP_PORT is 587 but SMTP_SECURE is 'true'. Port 587 uses STARTTLS — set SMTP_SECURE=false."
  );
}

// ---------------------------------------------------------------------------
// Transports
// ---------------------------------------------------------------------------

let transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number.isFinite(smtpPort) ? smtpPort : 587,
  secure: smtpSecure,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: env.NODE_ENV === "production" },
  connectionTimeout: 10_000, // fail fast instead of hanging the request
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
});

// Verify transport and attempt fallback to STARTTLS (port 587) on common failures
(async function initTransport() {
  try {
    await transporter.verify();
    logger.info("SMTP ready ✓");
  } catch (err) {
    logger.error("SMTP connection failed:", err);

    const shouldTryFallback = (Number.isFinite(smtpPort) && smtpPort === 465) ||
      err?.code === 'ETIMEDOUT' || err?.code === 'ECONNREFUSED' || err?.command === 'CONN';

    if (shouldTryFallback) {
      logger.info("Attempting SMTP fallback to port 587 with STARTTLS...");
      const fallback = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: 587,
        secure: false,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
        tls: { rejectUnauthorized: env.NODE_ENV === 'production' },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      });

      try {
        await fallback.verify();
        transporter = fallback;
        logger.info("SMTP fallback succeeded — using port 587 (STARTTLS).");
      } catch (err2) {
        logger.error("SMTP fallback to 587 failed:", err2);
      }
    }
  }
})();

const resend = new Resend(env.RESEND_API_KEY);

// ---------------------------------------------------------------------------
// Core senders
// ---------------------------------------------------------------------------

/**
 * Send a transactional email via SMTP (nodemailer).
 * Throws on failure — callers are responsible for try/catch if the
 * surrounding flow should survive an email failure (e.g. after a DB write
 * that already succeeded).
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const safeSubject = sanitizeHeaderValue(subject);

  const info = await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: safeSubject,
    html,
    text,
  });
  logger.info(`Email sent: ${info.messageId}`);
  return info;
};

const sendNewsletter = async ({ to, subject, html }) => {
  const safeSubject = sanitizeHeaderValue(subject);

  const data = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: Array.isArray(to) ? to : [to],
    subject: safeSubject,
    html,
  });
  logger.info(`Newsletter sent via Resend: ${data.id}`);
  return data;
};

// ---------------------------------------------------------------------------
// Template-based senders
// ---------------------------------------------------------------------------

/**
 * Send a 6-digit OTP to verify a new account email address.
 * @param {string} email - Recipient's email
 * @param {string} code  - 6-digit OTP
 */
const sendVerifyEmail = async (email, code) => {
  const { subject, html } = emailTemplates.verifyEmail(email, code);
  return sendEmail({ to: email, subject, html });
};

/**
 * Send a 6-digit OTP for a password reset request.
 * @param {string} name  - Recipient's display name
 * @param {string} email - Recipient's email
 * @param {string} code  - 6-digit OTP
 */
const sendPasswordReset = async (name, email, code) => {
  const { subject, html } = emailTemplates.passwordReset(name, code);
  return sendEmail({ to: email, subject, html });
};

/**
 * Invite a new team member to the admin panel.
 * @param {string} toEmail - Recipient's email
 * @param {string} inviterName  - Name of the person sending the invite
 * @param {string} role - Role being granted (e.g. "Editor")
 * @param {string} url - Accept-invitation URL
 */
const sendAdminInvite = async (toEmail, inviterName, role, url) => {
  const { subject, html } = emailTemplates.adminInvite(inviterName, role, url);
  return sendEmail({ to: toEmail, subject, html });
};

/**
 * Send a welcome email to a new newsletter subscriber.
 * @param {string} toEmail - Subscriber's email
 */
const sendWelcomeNewsletter = async (toEmail) => {
  const { subject, html } = emailTemplates.welcomeNewsletter();
  return sendNewsletter({ to: toEmail, subject, html });
};

/**
 * Notify the super-admin of a new contact form submission.
 * @param {{ name, email, subject, message, topic }} params
 */
const sendContactNotificationToAdmin = async ({ name, email, subject, message, topic }) => {
  const tpl = emailTemplates.contactNotificationAdmin({
    name,
    email,
    subject,
    message,
    topic,
    adminUrl: env.ADMIN_URL,
  });
  return sendEmail({
    to: env.SUPER_ADMIN_EMAIL,
    subject: tpl.subject,
    html: tpl.html,
  });
};

/**
 * Send the admin's reply back to the user who submitted the contact form.
 * @param {{ toName, toEmail, originalSubject, replyBody, adminName }} params
 */
const sendReplyToUser = async ({ toName, toEmail, originalSubject, replyBody, adminName }) => {
  const safeName = sanitizeHeaderValue(toName);
  const tpl = emailTemplates.replyToUser({ toName: safeName, replyBody, adminName });

  return sendEmail({
    to: buildSafeToHeader(safeName, toEmail),
    subject: `Re: ${sanitizeHeaderValue(originalSubject)}`,
    html: tpl.html,
  });
};

// ---------------------------------------------------------------------------
// Legacy templates object (kept for any callers that use templates.X directly)
// ---------------------------------------------------------------------------

const templates = {
  verifyEmail: (email, code) => emailTemplates.verifyEmail(email, code),
  passwordReset: (name, code) => emailTemplates.passwordReset(name, code),
  adminInvite: (inviterName, role, url) => emailTemplates.adminInvite(inviterName, role, url),
  welcomeNewsletter: () => emailTemplates.welcomeNewsletter(),
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  // core
  sendEmail,
  sendNewsletter,
  // template senders
  sendVerifyEmail,
  sendPasswordReset,
  sendAdminInvite,
  sendWelcomeNewsletter,
  sendContactNotificationToAdmin,
  sendReplyToUser,
  // legacy
  templates,
};