const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const logger = require("./logger");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  tls: { rejectUnauthorized: process.env.NODE_ENV === "production" },
});

const sendEmail = async ({ to, subject, html, text }) => {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM, to, subject, html, text,
  });
  logger.info(`Email sent: ${info.messageId}`);
  return info;
};

const resend = new Resend(process.env.RESEND_API_KEY);

const sendNewsletter = async ({ to, subject, html }) => {
  const data = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: Array.isArray(to) ? to : [to],
    subject, html,
  });
  logger.info(`Newsletter sent via Resend: ${data.id}`);
  return data;
};

const templates = {
  verifyEmail: (email, code) => ({
    subject: "Verify your OsunGist account",
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
    <h2>Welcome to OsunGist, ${email}!</h2>
    <p>Enter this 6-digit code to verify your email address:</p>
    <div style="font-size:36px;font-weight:bold;letter-spacing:10px;background:#f4f4f4;
                padding:20px;text-align:center;border-radius:8px;margin:20px 0">
      ${code}
    </div>
    <p>This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
  </div>`,
  }),

  passwordReset: (name, code) => ({
    subject: "Reset your OsunGist password",
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
    <h2>Password Reset</h2>
    <p>Hi ${name}, use this 6-digit code to reset your password:</p>
    <div style="font-size:36px;font-weight:bold;letter-spacing:10px;background:#f4f4f4;
                padding:20px;text-align:center;border-radius:8px;margin:20px 0">
      ${code}
    </div>
    <p>Expires in <strong>20 minutes</strong>. If you didn't request this, ignore this email.</p>
  </div>`,
  }),

  adminInvite: (inviterName, role, url) => ({
    subject: `You've been invited to OsunGist as ${role}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2>You're invited!</h2>
      <p><strong>${inviterName}</strong> has invited you to join OsunGist as <strong>${role}</strong>.</p>
      <a href="${url}" style="display:inline-block;background:#c0392b;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0">Accept Invitation</a>
      <p>This invite expires in <strong>48 hours</strong>.</p>
    </div>`,
  }),
  welcomeNewsletter: () => ({
    subject: "Welcome to OsunGist!",
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2>You are subscribed!</h2>
      <p>Thank you for subscribing to OsunGist. You will receive the latest news directly in your inbox.</p>
    </div>`,
  }),
};

module.exports = { sendEmail, sendNewsletter, templates };