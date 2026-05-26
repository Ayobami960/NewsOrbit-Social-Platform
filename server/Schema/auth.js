const Joi = require("joi");

// ─────────────────────────────────────────────────────────────────────────────
// Register
// ─────────────────────────────────────────────────────────────────────────────
exports.registerSchema = Joi.object({
  name: Joi.string().min(2).max(80).trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain uppercase, lowercase, number and special character.",
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .messages({ "any.only": "Passwords do not match" }),
});

// ─────────────────────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────────────────────
exports.loginSchema = Joi.object({
  email:    Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Verify Email
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyEmailSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  code:  Joi.string().length(6).required().messages({
    "string.length": "Verification code must be 6 digits",
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// Resend Verification Code
// ─────────────────────────────────────────────────────────────────────────────
exports.resendVerifyCodeSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Forgot Password
// ─────────────────────────────────────────────────────────────────────────────
exports.forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Verify Reset Code  (step 2)
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyResetCodeSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  code:  Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    "string.length":       "Code must be exactly 6 digits",
    "string.pattern.base": "Code must be numeric",
    "any.required":        "Code is required",
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// Reset Password  (step 3 — email + code re-verified server-side)
// ─────────────────────────────────────────────────────────────────────────────
exports.resetPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  code:  Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    "string.length":       "Code must be exactly 6 digits",
    "string.pattern.base": "Code must be numeric",
    "any.required":        "Code is required",
  }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain uppercase, lowercase, number and special character.",
    }),
  
});


// ─────────────────────────────────────────────────────────────────────────────
// Accept Invite (old single-step — kept for backwards compat if needed)
// ─────────────────────────────────────────────────────────────────────────────
exports.acceptInviteSchema = Joi.object({
  name: Joi.string().min(2).max(80).trim().optional(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain uppercase, lowercase, number and special character.",
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .messages({ "any.only": "Passwords do not match" }),
});

// ─────────────────────────────────────────────────────────────────────────────
// Invite flow — 3 new schemas
// ─────────────────────────────────────────────────────────────────────────────

// GET /invite/verify-token?token=<raw>
// validate() middleware should read req.query for GET routes.
exports.inviteVerifyTokenSchema = Joi.object({
  token: Joi.string().min(1).required().messages({
    "string.empty": "Token is required",
    "any.required": "Token is required",
  }),
});

// POST /invite/send-code   body: { token }
exports.inviteSendCodeSchema = Joi.object({
  token: Joi.string().min(1).required().messages({
    "string.empty": "Token is required",
    "any.required": "Token is required",
  }),
});

// POST /invite/verify-code   body: { token, code }
exports.inviteVerifyCodeSchema = Joi.object({
  token: Joi.string().min(1).required().messages({
    "string.empty": "Token is required",
    "any.required": "Token is required",
  }),
  code: Joi.string().length(6).required().messages({
    "string.length": "Verification code must be 6 digits",
  }),
});

// POST /invite/accept   body: { token, code, password }
exports.inviteAcceptSchema = Joi.object({
  token: Joi.string().min(1).required().messages({
    "string.empty": "Token is required",
    "any.required": "Token is required",
  }),
  code: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.length":       "Code must be exactly 6 digits",
      "string.pattern.base": "Code must be numeric",
      "any.required":        "Verification code is required",
    }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])/)
    .required()
    .messages({
      "string.min":          "Password must be at least 8 characters",
      "string.pattern.base": "Password must contain uppercase, lowercase, number and special character.",
      "any.required":        "Password is required",
    }),
});