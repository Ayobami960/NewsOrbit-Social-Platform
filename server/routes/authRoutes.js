const router   = require("express").Router();
const authCtrl = require("../controllers/auth.controller");
const { protect }        = require("../middlewares/auth");
const { validate }       = require("../middlewares/validate");
const { authRateLimiter } = require("../middlewares/security");
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerifyCodeSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  inviteVerifyTokenSchema,
  inviteSendCodeSchema,
  inviteAcceptSchema,
  inviteVerifyCodeSchema,
} = require("../Schema/auth");

// ── Standard public routes ─────────────────────────────────────────────────

router.post("/register",         authRateLimiter, validate(registerSchema),          authCtrl.register);
router.post("/login",            authRateLimiter, validate(loginSchema),             authCtrl.login);
router.post("/refresh",                                                               authCtrl.refresh);
router.post("/logout",           protect,                                             authCtrl.logout);
router.post("/verify-email",                      validate(verifyEmailSchema),        authCtrl.verifyEmail);
router.post("/resend-verify",                     validate(resendVerifyCodeSchema),   authCtrl.resendVerifyCode);
router.post("/forgot-password",  authRateLimiter, validate(forgotPasswordSchema),    authCtrl.forgotPassword);
router.post("/reset-password",   authRateLimiter, validate(resetPasswordSchema),     authCtrl.resetPassword);
router.get ("/me",               protect,   authCtrl.getMe);

// ── Invite flow — PUBLIC, no protect middleware 
//
//   Only admin and writer accounts go through this path.
//   Regular users self-register via /register above.
//
//   Step 1: frontend calls verify-token on page load to validate the link
//           and get the invitee's name / email / role for the UI.
//   Step 2: user clicks "Send verification code" → send-code emails an OTP.
//   Step 3: user enters OTP + sets a password → accept activates the account.

router.get ("/invite/verify-token", validate(inviteVerifyTokenSchema), authCtrl.inviteVerifyToken);
router.post("/invite/send-code",    validate(inviteSendCodeSchema),    authCtrl.inviteSendCode);
router.post("/invite/verify-code", validate(inviteVerifyCodeSchema), authCtrl.inviteVerifyCode);
router.post("/invite/accept",       validate(inviteAcceptSchema),      authCtrl.inviteAccept);

module.exports = router;
