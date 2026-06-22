const crypto = require("crypto");
const User   = require("../models/User");
const env = require("../lib/env");
const { log } = require("../models/ActivityLog");
const {
  generateAccessToken, generateRefreshToken,
  verifyRefreshToken, generateSecureToken, hashToken,
} = require("../utils/tokens");
const { sendEmail, templates } = require("../utils/email");
const {
  sendSuccess, sendCreated, sendError,
  sendUnauthorized, sendNotFound,
} = require("../utils/apiResponse");

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const generateOTP = () =>
  Math.floor(100_000 + Math.random() * 900_000).toString();

const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure:   env.NODE_ENV === "development" ? false : true,
    sameSite: "lax",
    maxAge:   7 * 24 * 60 * 60 * 1000,
    path:     "/",
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/register
// ─────────────────────────────────────────────────────────────────────────────

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email }))
      return sendError(res, "Email already in use.", 409);

    const code = generateOTP();

    const user = await User.create({
      name, email, password, role: "user",
      emailVerifyCode:    code,
      emailVerifyExpires: Date.now() + 10 * 60 * 1000,
    });

    const { subject, html } = templates.verifyEmail(name, code);
    await sendEmail({ to: email, subject, html }).catch(() => {});

    log({ user: user._id, action: "register", ip: req.ip });
    return sendCreated(
      res,
      { userId: user._id },
      "Registered! Check your email for the 6-digit verification code."
    );
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/verify-email   body: { email, code }
// ─────────────────────────────────────────────────────────────────────────────

exports.verifyEmail = async (req, res, next) => {
  try {
    const email = req.body?.email;
    const code  = req.body?.code?.toString();

    if (!email || !code)
      return sendError(res, "Email and verification code are required.", 400);

    const user = await User.findOne({ email })
      .select("+emailVerifyCode +emailVerifyExpires");

    if (!user)           return sendError(res, "User not found.", 404);
    if (user.isVerified) return sendError(res, "Email already verified.", 400);

    if (!user.emailVerifyCode || user.emailVerifyExpires < Date.now())
      return sendError(res, "Code has expired. Request a new one.", 400);

    if (user.emailVerifyCode !== code)
      return sendError(res, "Invalid verification code.", 400);

    user.isVerified         = true;
    user.emailVerifyCode    = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    log({ user: user._id, action: "email_verify", ip: req.ip });
    return sendSuccess(res, {}, "Email verified successfully.");
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/resend-verify   body: { email }
// ─────────────────────────────────────────────────────────────────────────────

exports.resendVerifyCode = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email })
      .select("+emailVerifyCode +emailVerifyExpires");

    if (!user)           return sendError(res, "User not found.", 404);
    if (user.isVerified) return sendError(res, "Email already verified.", 400);

    const code = generateOTP();
    user.emailVerifyCode    = code;
    user.emailVerifyExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const { subject, html } = templates.verifyEmail(user.name, code);
    await sendEmail({ to: email, subject, html }).catch(() => {});

    return sendSuccess(res, {}, "A new verification code has been sent to your email.");
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/login
// ─────────────────────────────────────────────────────────────────────────────

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email })
      .select("+password +failedLoginAttempts +lockUntil +refreshToken +role");

    if (!user) {
      log({ action: "failed_login", ip: req.ip, meta: { email }, severity: "warning", isSuspicious: true });
      return sendUnauthorized(res, "Invalid credentials.");
    }

    // Role-based policy
    const isRegularUser = user.role === "user";
    const MAX_ATTEMPTS = isRegularUser ? 3 : 5;
    const LOCK_TIME_MS = isRegularUser ? 60 * 60 * 1000 : 30 * 60 * 1000;

    // Check if account is currently locked
    if (user.isLocked) {
      const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      const message = isRegularUser 
        ? `Too many failed attempts. Please wait ${remainingMinutes} minutes before trying again.`
        : `Account locked. Try again in ${remainingMinutes} minutes.`;

      return sendError(res, message, 423);
    }

    // Verify password
    const match = await user.comparePassword(password);

    if (!match) {
      user.failedLoginAttempts += 1;

      let lockMessage = null;

      // Check if this attempt should lock the account
      if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
        user.lockUntil = Date.now() + LOCK_TIME_MS;
        const remainingMinutes = Math.ceil(LOCK_TIME_MS / 60000);

        lockMessage = isRegularUser 
          ? `Too many failed attempts. Please wait ${remainingMinutes} minutes before trying again.`
          : `Account locked. Try again in ${remainingMinutes} minutes.`;
      }

      await user.save();

      log({
        user: user._id,
        action: "failed_login",
        ip: req.ip,
        severity: "warning",
        isSuspicious: true,
      });

      // Return lock message if account just got locked
      if (lockMessage) {
        return sendError(res, lockMessage, 423);
      }

      // Otherwise return normal invalid credentials message
      return sendUnauthorized(res, "Invalid credentials.");
    }

    // ── SUCCESSFUL LOGIN ─────────────────────────────────────
    if (!user.isVerified) return sendError(res, "Please verify your email first.", 403);
    if (user.isBanned) return sendError(res, `Banned: ${user.banReason}`, 403);

    // Reset failed attempts
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    user.lastLoginIp = req.ip;
    user.loginCount += 1;

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = hashToken(refreshToken);
    await user.save();

    setRefreshCookie(res, refreshToken);

    log({
      user: user._id,
      action: "login",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return sendSuccess(res, { accessToken, user }, "Login successful.");

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────

exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const code = generateOTP();
      user.passwordResetCode    = code;
      user.passwordResetExpires = Date.now() + 20 * 60 * 1000;
      await user.save();

      const { subject, html } = templates.passwordReset(user.name, code);
      await sendEmail({ to: user.email, subject, html }).catch(() => {});
    }
    return sendSuccess(res, {}, "If that email exists, a reset code has been sent.");
  } catch (err) { next(err); }
};


// POST /api/v1/auth/verify-reset-code
// Verifies the code only (before showing password form)
exports.verifyResetCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return sendError(res, "Email and code are required.", 400);
    }

    const user = await User.findOne({ email })
      .select("+passwordResetCode +passwordResetExpires");

    if (!user) {
      return sendError(res, "User not found.", 404);
    }

    if (!user.passwordResetCode || user.passwordResetExpires < Date.now()) {
      return sendError(res, "Reset code has expired. Please request a new one.", 400);
    }

    if (user.passwordResetCode !== code.toString()) {
      return sendError(res, "Invalid verification code.", 400);
    }

    return sendSuccess(res, { 
      message: "Code verified successfully",
      email: user.email 
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, code, password } = req.body;

    if (!email || !code || !password) {
      return sendError(res, "Email, code and new password are required.", 400);
    }

    if (password.length < 8) {
      return sendError(res, "Password must be at least 8 characters long.", 400);
    }

    const user = await User.findOne({ email })
      .select("+passwordResetCode +passwordResetExpires");

    if (!user) {
      return sendNotFound(res, "User not found.");
    }

    // Final security check (even if frontend already verified)
    if (!user.passwordResetCode || user.passwordResetExpires < Date.now()) {
      return sendError(res, "Reset code has expired. Please request a new one.", 400);
    }

    if (user.passwordResetCode !== code.toString()) {
      return sendError(res, "Invalid reset code.", 400);
    }

    // Update password and clean up
    user.password = password;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = undefined;        // Invalidate all sessions

    await user.save();

    res.clearCookie("refreshToken");

    return sendSuccess(res, {}, "Password has been reset successfully. You can now login.");
  } catch (err) {
    next(err);
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/refresh
// ─────────────────────────────────────────────────────────────────────────────

exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return sendUnauthorized(res, "No refresh token.");

    const decoded = verifyRefreshToken(token);
    const user    = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== hashToken(token))
      return sendUnauthorized(res, "Invalid refresh token.");

    const accessToken  = generateAccessToken(user._id, user.role);
    const newRefresh   = generateRefreshToken(user._id);
    user.refreshToken  = hashToken(newRefresh);
    await user.save();

    setRefreshCookie(res, newRefresh);
    return sendSuccess(res, { accessToken }, "Token refreshed.");
  } catch (err) {
    if (["TokenExpiredError", "JsonWebTokenError"].includes(err.name))
      return sendUnauthorized(res, "Session expired.");
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/logout
// ─────────────────────────────────────────────────────────────────────────────

exports.logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
      log({ user: req.user._id, action: "logout", ip: req.ip });
    }
    res.clearCookie("refreshToken");
    return sendSuccess(res, {}, "Logged out.");
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/auth/me
// ─────────────────────────────────────────────────────────────────────────────

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return sendSuccess(res, { user });
  } catch (err) { next(err); }
};

// ═════════════════════════════════════════════════════════════════════════════
// INVITE FLOW  (admin / writer only — no self-registration)
//
//   Step 1  GET  /api/v1/auth/invite/verify-token?token=<raw>
//           Validate the link token and return { name, email, role }
//           so the frontend can greet the invitee before any action.
//
//   Step 2  POST /api/v1/auth/invite/send-code   body: { token }
//           Issue a fresh 6-digit OTP hashed to the user doc and
//           email it to the invitee. Safe to call multiple times (resend).
//
//   Step 3  POST /api/v1/auth/invite/accept      body: { token, code, password }
//           Verify OTP → set password → activate account.
//           Replaces the old single-step acceptInvite.
//
// All three routes are PUBLIC (no protect middleware).
// Only admin/writer accounts go through this path; regular users self-register.
// ═════════════════════════════════════════════════════════════════════════════

// ── Internal helper ───────────────────────────────────────────────────────────

/**
 * Generate a random 6-digit OTP, hash it with SHA-256, persist it on the
 * user document with a 15-minute expiry, and return the plaintext OTP.
 * The plaintext is sent by email and never stored anywhere.
 */
async function issueInviteOtp(user) {
  const otp    = generateOTP();
  const hashed = crypto.createHash("sha256").update(otp).digest("hex");

  user.inviteOtp        = hashed;
  user.inviteOtpExpires = Date.now() + 15 * 60 * 1000;   // 15 min
  await user.save({ validateBeforeSave: false });

  return otp;
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — GET /api/v1/auth/invite/verify-token?token=<raw>
// ─────────────────────────────────────────────────────────────────────────────

exports.inviteVerifyToken = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return sendError(res, "Token is required.", 400);

    const user = await User.findOne({
      inviteToken:   hashToken(token),
      inviteExpires: { $gt: Date.now() },
      isInviteUsed:  false,
    }).select("name email role");

    if (!user)
      return sendError(res, "Invite link is invalid or has expired.", 400);

    return sendSuccess(res, {
      name:  user.name,
      email: user.email,
      role:  user.role,
    });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — POST /api/v1/auth/invite/send-code   body: { token }
// ─────────────────────────────────────────────────────────────────────────────

exports.inviteSendCode = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return sendError(res, "Token is required.", 400);

    const user = await User.findOne({
      inviteToken:   hashToken(token),
      inviteExpires: { $gt: Date.now() },
      isInviteUsed:  false,
    });

    if (!user)
      return sendError(res, "Invite link is invalid or has expired.", 400);

    const otp = await issueInviteOtp(user);

    const subject = "Your NewOrbit verification code";
    const html    = `
      <p style="font-family:sans-serif;">Hi ${user.name},</p>
      <p style="font-family:sans-serif;">
        Use the code below to verify your email and complete your account setup.
        It expires in <strong>15 minutes</strong>.
      </p>
      <div style="
        display:inline-block;
        padding:16px 32px;
        background:#18181b;
        color:#f4f4f5;
        font-size:32px;
        font-weight:700;
        letter-spacing:12px;
        border-radius:12px;
        margin:16px 0;
        font-family:monospace;
      ">${otp}</div>
      <p style="font-family:sans-serif;color:#71717a;font-size:13px;">
        Do not share this code with anyone. If you didn't expect this email, ignore it.
      </p>
    `;

    await sendEmail({ to: user.email, subject, html });

    log({
      action:   "email_verify",
      resource: user._id.toString(),
      meta:     { step: "invite_otp_sent" },
      ip:       req.ip,
    });

    return sendSuccess(res, {}, "Verification code sent to your email.");
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// Step 2.5 — POST /api/v1/auth/invite/verify-code
// Verifies the OTP only (without setting password)
// Useful if you want separate "Verify Code" → "Set Password" steps
// ─────────────────────────────────────────────────────────────────────────────

exports.inviteVerifyCode = async (req, res, next) => {
  try {
    const { token, code } = req.body;

    if (!token || !code)
      return sendError(res, "Token and verification code are required.", 400);

    const user = await User.findOne({
      inviteToken:   hashToken(token),
      inviteExpires: { $gt: Date.now() },
      isInviteUsed:  false,
    }).select("+inviteOtp +inviteOtpExpires");

    if (!user)
      return sendError(res, "Invite link is invalid or has expired.", 400);

    if (!user.inviteOtp || !user.inviteOtpExpires)
      return sendError(res, "No verification code has been sent yet.", 400);

    if (user.inviteOtpExpires < Date.now())
      return sendError(res, "Verification code has expired. Please request a new one.", 400);

    const hashedCode = crypto.createHash("sha256").update(code.toString()).digest("hex");

    if (hashedCode !== user.inviteOtp)
      return sendError(res, "Invalid verification code.", 400);

    // Code is valid — return success so frontend can move to set_password step
    return sendSuccess(res, { 
      message: "Code verified successfully",
      email: user.email 
    });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — POST /api/v1/auth/invite/accept   body: { token, code, password }
//
// Replaces the old single-step exports.acceptInvite.
// ─────────────────────────────────────────────────────────────────────────────

exports.inviteAccept = async (req, res, next) => {
  try {
    const { token, code, password } = req.body;

    if (!token || !code || !password)
      return sendError(res, "token, code and password are all required.", 400);

    if (password.length < 8)
      return sendError(res, "Password must be at least 8 characters.", 400);

    const user = await User.findOne({
      inviteToken:   hashToken(token),
      inviteExpires: { $gt: Date.now() },
      isInviteUsed:  false,
    }).select("+inviteOtp +inviteOtpExpires +password");

    if (!user)
      return sendError(res, "Invite link is invalid or has expired.", 400);

    // Guard: OTP must have been issued (step 2 must have run)
    if (!user.inviteOtp || !user.inviteOtpExpires)
      return sendError(
        res,
        "No verification code was issued. Please request a new one.",
        400
      );

    if (user.inviteOtpExpires < Date.now())
      return sendError(
        res,
        "Verification code has expired. Please request a new one.",
        400
      );

    const hashedCode = crypto.createHash("sha256").update(code).digest("hex");
    if (hashedCode !== user.inviteOtp)
      return sendError(res, "Incorrect verification code.", 400);

    // Activate the account
    user.password = password;   // pre-save hook hashes this
    user.isVerified = true;
    user.isActive = true;
    user.isInviteUsed = true;

    // Wipe all invite / OTP fields
    user.inviteToken  = undefined;
    user.inviteExpires  = undefined;
    user.inviteOtp = undefined;
    user.inviteOtpExpires = undefined;

    await user.save();

    log({
      user:   user._id,
      action: "user_invite",
      meta:   { step: "invite_accepted", role: user.role },
      ip:     req.ip,
    });

    return sendSuccess(res, {}, "Account activated. You can now log in.");
  } catch (err) { next(err); }
};