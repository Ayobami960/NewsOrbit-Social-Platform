const router    = require("express").Router();
const authCtrl  = require("../controllers/auth.controller");
const { protect }         = require("../middlewares/auth");
const { validate }        = require("../middlewares/validate");
const { authRateLimiter } = require("../middlewares/security");
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerifyCodeSchema,
  forgotPasswordSchema,
  verifyResetCodeSchema,
  resetPasswordSchema,
  inviteVerifyTokenSchema,
  inviteSendCodeSchema,
  inviteVerifyCodeSchema,
  inviteAcceptSchema,
} = require("../Schema/auth");

// ── Standard public routes ────────────────────────────────────────────────────

router.post("/register",     authRateLimiter, validate(registerSchema),        authCtrl.register);
router.post("/login",        authRateLimiter, validate(loginSchema),            authCtrl.login);
router.post("/refresh", authCtrl.refresh);
router.post("/logout",       protect,                                            authCtrl.logout);
router.post("/verify-email", validate(verifyEmailSchema),                        authCtrl.verifyEmail);
router.post("/resend-verify",validate(resendVerifyCodeSchema),                   authCtrl.resendVerifyCode);
router.get ("/me",           protect,                                            authCtrl.getMe);

router.post("/forgot-password",   authRateLimiter, validate(forgotPasswordSchema),  authCtrl.forgotPassword);
router.post("/verify-reset-code", authRateLimiter, validate(verifyResetCodeSchema), authCtrl.verifyResetCode);
router.post("/reset-password",    authRateLimiter, validate(resetPasswordSchema),   authCtrl.resetPassword);

// ── Invite flow ───────────────────────────────────────────────────────────────
//
//   Only admin / writer accounts go through this path.
//   Regular users self-register via /register above.
router.get ("/invite/verify-token", validate(inviteVerifyTokenSchema), authCtrl.inviteVerifyToken);
router.post("/invite/send-code", validate(inviteSendCodeSchema),    authCtrl.inviteSendCode);
router.post("/invite/verify-code", validate(inviteVerifyCodeSchema),  authCtrl.inviteVerifyCode);
router.post("/invite/accept",  validate(inviteAcceptSchema),      authCtrl.inviteAccept);

module.exports = router;