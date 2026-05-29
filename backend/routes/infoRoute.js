const router = require("express").Router();
const { protect, restrictTo, optionalAuth } = require("../middlewares/auth");

// ── Controllers ───────────────────────────────────────────────────────────────
const articleCtrl      = require("../controllers/article.controller");
const commentCtrl      = require("../controllers/comment.controller");
const followCtrl       = require("../controllers/follow.controller");
const notificationCtrl = require("../controllers/notification.controller");
const pushCtrl         = require("../controllers/push.controller");
const newsletterCtrl   = require("../controllers/newsletter.controller");

// ── Middlewares ───────────────────────────────────────────────────────────────
const { uploadArticleMedia, uploadSingleImage } = require("../middlewares/upload");
const { validate } = require("../middlewares/validate");
const { createArticle, updateArticle } = require("../validators/article.validator");

// ════════════════════════════════════════════════════════════════════════════
//  ARTICLES
// ════════════════════════════════════════════════════════════════════════════
router.get ("/articles",          optionalAuth, articleCtrl.getArticles);
router.get ("/articles/breaking",              articleCtrl.getBreakingNews);
router.get ("/articles/:slug",    optionalAuth, articleCtrl.getArticle);

router.post(
  "/articles",
  protect,
  restrictTo("super_admin", "admin", "writer"),
  uploadArticleMedia,
  validate(createArticle),
  articleCtrl.createArticle
);
router.patch(
  "/articles/:id",
  protect,
  restrictTo("super_admin", "admin", "writer"),
  uploadArticleMedia,
  validate(updateArticle),
  articleCtrl.updateArticle
);
router.delete("/articles/:id",    protect, restrictTo("super_admin", "admin"), articleCtrl.deleteArticle);
router.post  ("/articles/:id/react", protect, articleCtrl.reactToArticle);

// ════════════════════════════════════════════════════════════════════════════
//  COMMENTS  (nested under articles)
// ════════════════════════════════════════════════════════════════════════════
router.get   ("/articles/:articleId/comments",        optionalAuth, commentCtrl.getComments);
router.post  ("/articles/:articleId/comments",        protect,      commentCtrl.createComment);

// Standalone comment operations
router.patch ("/comments/:id",                        protect,      commentCtrl.updateComment);
router.delete("/comments/:id",                        protect,      commentCtrl.deleteComment);
router.post  ("/comments/:id/like",                   protect,      commentCtrl.likeComment);
router.post  ("/comments/:id/report",                 protect,      commentCtrl.reportComment);
router.patch ("/comments/:id/moderate",
  protect, restrictTo("admin", "super_admin"),
  commentCtrl.moderateComment
);

// ════════════════════════════════════════════════════════════════════════════
//  FOLLOW SYSTEM
// ════════════════════════════════════════════════════════════════════════════
router.post  ("/users/:id/follow",        protect, followCtrl.followUser);
router.delete("/users/:id/follow",        protect, followCtrl.unfollowUser);
router.get   ("/users/:id/followers",              followCtrl.getFollowers);
router.get   ("/users/:id/following",              followCtrl.getFollowing);
router.get   ("/users/:id/follow-status", protect, followCtrl.getFollowStatus);

// ════════════════════════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ════════════════════════════════════════════════════════════════════════════
router.get   ("/notifications",           protect, notificationCtrl.getMyNotifications);
router.patch ("/notifications/read-all",  protect, notificationCtrl.markAllAsRead);
router.patch ("/notifications/:id/read",  protect, notificationCtrl.markAsRead);
router.delete("/notifications/:id",       protect, notificationCtrl.deleteNotification);

// ════════════════════════════════════════════════════════════════════════════
//  PUSH NOTIFICATIONS
// ════════════════════════════════════════════════════════════════════════════
router.get ("/push/vapid-public-key",     pushCtrl.getPublicKey);
router.post("/push/subscribe",            optionalAuth, pushCtrl.subscribe);
router.delete("/push/unsubscribe",        pushCtrl.unsubscribe);
router.post("/push/broadcast",
  protect, restrictTo("admin", "super_admin"),
  pushCtrl.broadcast
);

// ════════════════════════════════════════════════════════════════════════════
//  NEWSLETTER
// ════════════════════════════════════════════════════════════════════════════
router.post("/newsletter/subscribe",   newsletterCtrl.subscribe);
router.get ("/newsletter/unsubscribe", newsletterCtrl.unsubscribe);
router.get ("/newsletter/subscribers",
  protect, restrictTo("admin", "super_admin"),
  newsletterCtrl.getSubscribers
);
router.post("/newsletter/send",
  protect, restrictTo("admin", "super_admin"),
  newsletterCtrl.sendNewsletterBroadcast
);

module.exports = router;
