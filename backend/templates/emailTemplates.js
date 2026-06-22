/**
 * NewsOrbit — Email HTML Templates
 *
 * All templates return a { subject, html } object.
 * The shared `layout()` wrapper keeps branding consistent across every email.
 */

// ---------------------------------------------------------------------------
// Shared layout wrapper
// ---------------------------------------------------------------------------

const layout = ({ eyebrow = "", headline = "", preheader = "", body = "", footer = "" }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; display: block; }
    a { color: inherit; }
  </style>
</head>
<body style="margin:0;padding:0;background:#f0ede8;font-family:'Helvetica Neue',Arial,sans-serif;">

  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;</div>

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f0ede8;padding:40px 16px;">
    <tr><td align="center">

    <!-- Email card -->
    <table width="600" cellpadding="0" cellspacing="0" role="presentation"
      style="max-width:600px;width:100%;background:#ffffff;border:1px solid #ddd8d0;">

      <!-- ── Masthead ── -->
      <tr>
        <td style="border-bottom:3px solid #1a1a1a;padding:22px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td>
                <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#1a1a1a;letter-spacing:-0.5px;">NewsOrbit</span>
                ${eyebrow ? `<span style="display:block;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#999;margin-top:3px;">${eyebrow}</span>` : ""}
              </td>
              ${headline ? `
              <td align="right">
                <span style="display:inline-block;background:#1a1a1a;color:#fff;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;padding:4px 10px;">${headline}</span>
              </td>` : ""}
            </tr>
          </table>
        </td>
      </tr>

      <!-- ── Body ── -->
      ${body}

      <!-- ── Footer ── -->
      <tr>
        <td style="border-top:1px solid #e0dbd3;padding:14px 32px;background:#f7f5f2;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="font-size:11px;color:#aaa;line-height:1.5;">
                ${footer || "&copy; NewsOrbit. All rights reserved."}
              </td>
              <td align="right" style="font-size:11px;">
                <a href="{{unsubscribeUrl}}" style="color:#bbb;text-decoration:none;">Unsubscribe</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
    </td></tr>
  </table>
</body>
</html>`;

// ---------------------------------------------------------------------------
// Reusable building blocks
// ---------------------------------------------------------------------------

/** A large OTP code block */
const otpBlock = (code) => `
<tr>
  <td style="padding:20px 32px;">
    <div style="font-size:38px;font-weight:700;letter-spacing:14px;background:#f4f1eb;
                padding:22px 20px;text-align:center;border:1px solid #e0dbd3;
                color:#1a1a1a;font-family:'Courier New',Courier,monospace;">
      ${code}
    </div>
  </td>
</tr>`;

/** Left-rule attribution block (used for sender info and sign-offs) */
const leftRule = ({ primary, secondary }) => `
<table cellpadding="0" cellspacing="0" role="presentation" style="border-left:3px solid #1a1a1a;padding-left:14px;">
  <tr><td style="font-size:14px;font-weight:600;color:#1a1a1a;">${primary}</td></tr>
  ${secondary ? `<tr><td style="font-size:12px;color:#888;padding-top:2px;">${secondary}</td></tr>` : ""}
</table>`;

/** Black CTA button */
const ctaButton = (text, url) => `
<table cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td style="background:#1a1a1a;">
      <a href="${url}"
         style="display:inline-block;padding:12px 24px;font-size:13px;font-weight:600;
                letter-spacing:0.04em;color:#ffffff;text-decoration:none;">
        ${text} &rarr;
      </a>
    </td>
  </tr>
</table>`;

/** Horizontal rule with an optional label */
const dividerRow = (label = "") => `
<tr>
  <td style="padding:${label ? "24px" : "8px"} 32px 0;">
    ${label ? `<p style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#aaa;margin:0 0 8px;">${label}</p>` : ""}
    <div style="height:1px;background:#e0dbd3;font-size:0;">&nbsp;</div>
  </td>
</tr>`;

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

const emailTemplates = {

  // ── Verify email ──────────────────────────────────────────────────────────
  verifyEmail: (email, code) => ({
    subject: "Verify your NewsOrbit account",
    html: layout({
      eyebrow: "Account Verification",
      preheader: `Your verification code is ${code}`,
      body: `
        <tr>
          <td style="padding:32px 32px 0;">
            <p style="font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#1a1a1a;margin:0 0 8px;">
              Welcome to NewsOrbit
            </p>
            <p style="font-size:15px;line-height:1.7;color:#444;margin:0;">
              Enter the code below to verify <strong style="color:#1a1a1a;">${email}</strong>
              and activate your account.
            </p>
          </td>
        </tr>
        ${otpBlock(code)}
        <tr>
          <td style="padding:0 32px 32px;">
            <p style="font-size:13px;color:#888;margin:0;line-height:1.6;">
              This code expires in <strong style="color:#555;">10 minutes</strong>.
              Do not share it with anyone — NewsOrbit will never ask for it.
            </p>
          </td>
        </tr>
      `,
      footer: "If you didn't create a NewsOrbit account, you can safely ignore this email.",
    }),
  }),

  // ── Password reset ────────────────────────────────────────────────────────
  passwordReset: (name, code) => ({
    subject: "Reset your NewsOrbit password",
    html: layout({
      eyebrow: "Security",
      headline: "Password Reset",
      preheader: "You requested a password reset",
      body: `
        <tr>
          <td style="padding:32px 32px 0;">
            <p style="font-size:15px;line-height:1.7;color:#444;margin:0;">
              Hi <strong style="color:#1a1a1a;">${name}</strong>, use this code to reset your password.
            </p>
          </td>
        </tr>
        ${otpBlock(code)}
        <tr>
          <td style="padding:0 32px 32px;">
            <p style="font-size:13px;color:#888;margin:0;line-height:1.6;">
              Expires in <strong style="color:#555;">20 minutes</strong>.
              If you didn't request a reset, your account is safe — just ignore this email.
            </p>
          </td>
        </tr>
      `,
    }),
  }),

  // ── Admin invite ──────────────────────────────────────────────────────────
  adminInvite: (inviterName, role, url) => ({
    subject: `You've been invited to NewsOrbit as ${role}`,
    html: layout({
      eyebrow: "Team Invitation",
      headline: role,
      preheader: `${inviterName} invited you to join NewsOrbit`,
      body: `
        <tr>
          <td style="padding:32px 32px 0;">
            <p style="font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#1a1a1a;margin:0 0 12px;">
              You&rsquo;re invited
            </p>
            <p style="font-size:15px;line-height:1.7;color:#444;margin:0;">
              <strong style="color:#1a1a1a;">${inviterName}</strong> has invited you to join
              NewsOrbit as <strong style="color:#1a1a1a;">${role}</strong>.
              Click below to accept and set up your account.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;">
            ${ctaButton("Accept invitation", url)}
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 32px;">
            <p style="font-size:13px;color:#888;margin:0;line-height:1.6;">
              This invitation expires in <strong style="color:#555;">48 hours</strong>.
              If you weren&rsquo;t expecting this, you can ignore it.
            </p>
          </td>
        </tr>
      `,
    }),
  }),

  // ── Welcome newsletter ────────────────────────────────────────────────────
  welcomeNewsletter: () => ({
    subject: "Welcome to NewsOrbit",
    html: layout({
      eyebrow: "Newsletter",
      preheader: "You're now subscribed to NewsOrbit",
      body: `
        <tr>
          <td style="padding:32px 32px 0;">
            <p style="font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#1a1a1a;margin:0 0 12px;">
              You&rsquo;re subscribed
            </p>
            <p style="font-size:15px;line-height:1.7;color:#444;margin:0;">
              Thank you for subscribing to NewsOrbit. The latest stories, analysis,
              and breaking news will arrive directly in your inbox.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 32px;">
            <p style="font-size:13px;color:#888;margin:0;line-height:1.6;">
              You can manage your subscription preferences at any time from your account settings.
            </p>
          </td>
        </tr>
      `,
    }),
  }),

  // ── Contact notification → admin ──────────────────────────────────────────
  contactNotificationAdmin: ({ name, email, subject, message, topic, adminUrl }) => ({
    subject: `[Contact] ${topic.toUpperCase()} — ${subject}`,
    html: layout({
      eyebrow: "Admin Notification",
      headline: "Contact",
      preheader: `New message from ${name} (${topic})`,
      body: `
        <tr>
          <td style="padding:28px 32px 0;">
            <span style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#999;font-weight:600;">
              ${topic}
            </span>
            <p style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;
                       color:#1a1a1a;margin:6px 0 0;line-height:1.3;">
              ${subject}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 0;">
            ${leftRule({ primary: name, secondary: `<a href="mailto:${email}" style="color:#888;text-decoration:none;">${email}</a>` })}
          </td>
        </tr>
        ${dividerRow("Message")}
        <tr>
          <td style="padding:20px 32px;">
            <p style="font-size:15px;line-height:1.75;color:#2a2a2a;margin:0;">
              ${message.replace(/\n/g, "<br/>")}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 32px;">
            ${ctaButton("View in dashboard", `${adminUrl}/contact-messages`)}
          </td>
        </tr>
      `,
      footer: "Sent by NewsOrbit &mdash; Triggered by a contact form submission.",
    }),
  }),

  // ── Reply → user ──────────────────────────────────────────────────────────
  replyToUser: ({ toName, replyBody, adminName }) => ({
    subject: undefined, // subject is set by the caller
    html: layout({
      eyebrow: "Support Reply",
      preheader: `A reply from the NewsOrbit team`,
      body: `
        <tr>
          <td style="padding:32px 32px 0;">
            <p style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#1a1a1a;margin:0 0 20px;">
              Hi ${toName},
            </p>
            <p style="font-size:15px;line-height:1.75;color:#2a2a2a;margin:0;">
              ${replyBody.replace(/\n/g, "<br/>")}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 32px;">
            ${leftRule({ primary: adminName, secondary: "NewsOrbit Team" })}
          </td>
        </tr>
        ${dividerRow()}
        <tr>
          <td style="padding:16px 32px 28px;">
            <p style="font-size:11px;color:#aaa;margin:0;line-height:1.6;">
              This is a reply to your message sent via the NewsOrbit contact form.
              If you have further questions, you can submit a new message at any time.
            </p>
          </td>
        </tr>
      `,
    }),
  }),

};

module.exports = { emailTemplates };