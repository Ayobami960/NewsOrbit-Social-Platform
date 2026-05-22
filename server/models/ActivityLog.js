// const mongoose = require("mongoose");

// const activityLogSchema = new mongoose.Schema(
//   {
//     user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
//     action: {
//       type: String,
//       required: true,
//       enum: [
//         // Auth
//         "login", "logout", "register", "password_reset", "email_verify",
//         "token_refresh", "failed_login",
//         // Articles
//         "article_create", "article_update", "article_delete",
//         "article_publish", "article_schedule",
//         // Comments
//         "comment_create", "comment_edit", "comment_delete", "comment_report",
//         // Follow
//         "user_follow", "user_unfollow",
//         // Media
//         "media_upload", "media_delete",
//         // Admin
//         "user_ban", "user_unban", "user_role_change",
//         "category_create", "category_update", "category_delete",
//         // Suspicious
//         "rate_limit_hit", "injection_attempt", "forbidden_access",
//       ],
//     },
//     ip:           String,
//     userAgent:    String,
//     resource:     String,
//     resourceType: String,
//     meta:         { type: Object },
//     severity: {
//       type: String,
//       enum: ["info", "warning", "critical"],
//       default: "info",
//     },
//     isSuspicious: { type: Boolean, default: false, index: true },
//   },
//   { timestamps: true }
// );

// activityLogSchema.index({ action: 1, createdAt: -1 });
// activityLogSchema.index({ isSuspicious: 1, createdAt: -1 });
// activityLogSchema.index({ ip: 1, createdAt: -1 });

// // Auto-expire after 90 days
// activityLogSchema.index(
//   { createdAt: 1 },
//   { expireAfterSeconds: 60 * 60 * 24 * 90 }
// );

// const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

// const log = (data) => ActivityLog.create(data).catch(() => {});

// module.exports = { ActivityLog, log };
const mongoose = require("mongoose");
const activitySchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  action: {
    type: String, required: true,
    enum: [
      "login","logout","register","password_reset","email_verify","token_refresh","failed_login",
      "article_create","article_update","article_delete","article_publish","article_schedule",
      "blog_create","blog_update","blog_delete","blog_approve","blog_reject",
      "comment_create","comment_edit","comment_delete","comment_report",
      "user_follow","user_unfollow",
      "media_upload","media_delete",
      "user_create","user_ban","user_unban","user_role_change","user_invite",
      "category_create","category_update","category_delete",
      "rate_limit_hit","injection_attempt","forbidden_access",
    ],
  },
  ip:           String,
  userAgent:    String,
  resource:     String,
  resourceType: String,
  meta:         { type: Object },
  severity:     { type: String, enum: ["info","warning","critical"], default: "info" },
  isSuspicious: { type: Boolean, default: false, index: true },
}, { timestamps: true });
activitySchema.index({ action: 1, createdAt: -1 });
activitySchema.index({ isSuspicious: 1, createdAt: -1 });
activitySchema.index({ ip: 1, createdAt: -1 });
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
const ActivityLog = mongoose.model("ActivityLog", activitySchema);
const log = (data) => ActivityLog.create(data).catch(() => {});
module.exports = { ActivityLog, log };