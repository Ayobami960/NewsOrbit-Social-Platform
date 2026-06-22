const Joi = require("joi");

// ─────────────────────────────────────────────────────────────────────────────
// Reusable, hardened field definitions
// ─────────────────────────────────────────────────────────────────────────────

const nameField = Joi.string()
  .min(10)
  .max(50)
  .trim()
  .pattern(/^[a-zA-Z][a-zA-Z\s'-]*[a-zA-Z]$/) // must start/end with a letter — blocks leading/trailing junk like "--" or "' '"
  .pattern(/\s{2,}/, { invert: true }) // reject double spaces (often used to sneak past max-length UX checks)
  .required()
  .messages({
    "string.pattern.base": "Name can only contain letters, spaces, hyphens and apostrophes, and cannot start/end with a symbol.",
    "string.min": "Name must be at least 15 characters.",
    "string.max": "Name must not exceed 20 characters.",
  });

const emailField = Joi.string()
  .email({ tlds: { allow: false }, minDomainSegments: 2 })
  .lowercase()
  .trim()
  .max(254) // RFC 5321 max email length
  .pattern(/^[^<>()[\]\\,;:%"\s]+@[^<>()[\]\\,;:%"\s]+$/) // belt-and-braces: reject control/encoded chars Joi's email() sometimes lets slip
  .required()
  .messages({
    "string.email": "Please enter a valid email address.",
    "string.pattern.base": "Email contains invalid characters.",
  });

const passwordField = Joi.string()
  .min(10) // bumped from 8 — 10+ meaningfully raises brute-force cost
  .max(72) // bcrypt truncates at 72 bytes
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#^~+=])/)
  .invalid(Joi.ref("$email")) // password must not equal the email (context-injected, see notes below)
  .required()
  .messages({
    "string.pattern.base":
      "Password must contain uppercase, lowercase, number and special character.",
    "string.min": "Password must be at least 10 characters.",
    "string.max": "Password must not exceed 72 characters.",
    "any.invalid": "Password cannot be the same as your email.",
  });

const sixDigitCode = Joi.string()
  .length(6)
  .pattern(/^\d{6}$/)
  .required()
  .messages({
    "string.length": "Code must be exactly 6 digits",
    "string.pattern.base": "Code must be numeric",
    "any.required": "Code is required",
  });

const tokenField = Joi.string()
  .min(16) // raw invite tokens should never realistically be shorter than this
  .max(512)
  .trim()
  .pattern(/^[a-zA-Z0-9_-]+$/) // tokens are hex/base64url — reject anything else outright
  .required()
  .messages({
    "string.empty": "Token is required",
    "any.required": "Token is required",
    "string.max": "Token is invalid",
    "string.pattern.base": "Token is invalid",
  });


// ─────────────────────────────────────────────────────────────────────────────
// Register
// ─────────────────────────────────────────────────────────────────────────────
exports.registerSchema = Joi.object({
  name: nameField,
  email: emailField,
  password: passwordField,
  confirmPassword: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .messages({ "any.only": "Passwords do not match" }),
}).options({ stripUnknown: true });

// ─────────────────────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────────────────────
exports.loginSchema = Joi.object({
  email: emailField,
  password: Joi.string().min(1).max(128).required(), // intentionally lenient — don't leak policy on login
}).options({ stripUnknown: true });

// ─────────────────────────────────────────────────────────────────────────────
// Verify Email
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyEmailSchema = Joi.object({
  email: emailField,
  code: sixDigitCode,
}).options({ stripUnknown: true });

// ─────────────────────────────────────────────────────────────────────────────
// Resend Verification Code
// ─────────────────────────────────────────────────────────────────────────────
exports.resendVerifyCodeSchema = Joi.object({
  email: emailField,
}).options({ stripUnknown: true });

// ─────────────────────────────────────────────────────────────────────────────
// Forgot Password
// ─────────────────────────────────────────────────────────────────────────────
exports.forgotPasswordSchema = Joi.object({
  email: emailField,
}).options({ stripUnknown: true });

// ─────────────────────────────────────────────────────────────────────────────
// Verify Reset Code (step 2)
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyResetCodeSchema = Joi.object({
  email: emailField,
  code: sixDigitCode,
}).options({ stripUnknown: true });

// ─────────────────────────────────────────────────────────────────────────────
// Reset Password (step 3)
// ─────────────────────────────────────────────────────────────────────────────
exports.resetPasswordSchema = Joi.object({
  email: emailField,
  code: sixDigitCode,
  password: passwordField,
}).options({ stripUnknown: true });

// ─────────────────────────────────────────────────────────────────────────────
// Admin: invite a user
// ─────────────────────────────────────────────────────────────────────────────
exports.inviteUserSchema = Joi.object({
  email: emailField,
  role: Joi.string().valid("admin", "writer").required(), // never trust "super_admin" here
  name: nameField.optional(),
  partnerCompany: Joi.string()
    .trim()
    .min(2)
    .max(120)
    .pattern(/^[a-zA-Z0-9\s&.,'-]+$/) // block HTML/script injection in company name
    .optional()
    .messages({
      "string.pattern.base": "Partner company contains invalid characters.",
    }),
}).options({ stripUnknown: true });

exports.inviteManagementSchema = Joi.object({
  name: nameField,
  email: emailField,
  inviteManagement: Joi.string()
    .valid("content_manager", "community_manager", "operations_manager", "editorial_manager")
    .required(),
}).options({ stripUnknown: true });

// ─────────────────────────────────────────────────────────────────────────────
// Accept Invite (legacy single-step)
// ─────────────────────────────────────────────────────────────────────────────
exports.acceptInviteSchema = Joi.object({
  name: nameField.optional(),
  password: passwordField,
  confirmPassword: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .messages({ "any.only": "Passwords do not match" }),
}).options({ stripUnknown: true });

// ─────────────────────────────────────────────────────────────────────────────
// Invite flow
// ─────────────────────────────────────────────────────────────────────────────
exports.inviteVerifyTokenSchema = Joi.object({
  token: tokenField,
}).options({ stripUnknown: true });

exports.inviteSendCodeSchema = Joi.object({
  token: tokenField,
}).options({ stripUnknown: true });

exports.inviteVerifyCodeSchema = Joi.object({
  token: tokenField,
  code: sixDigitCode,
}).options({ stripUnknown: true });

exports.inviteAcceptSchema = Joi.object({
  token: tokenField,
  code: sixDigitCode,
  password: passwordField,
}).options({ stripUnknown: true });
