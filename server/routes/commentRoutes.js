const express = require("express");
const ctrl = require("../controllers/comment.controller");
const { protect, restrictTo, optionalAuth } = require("../middlewares/auth");

// ── Nested router ──────────────────────────────────────────────────────────────
// Mounted at /articles/:articleId/comments  AND  /blogs/:blogId/comments
// mergeParams lets us read :articleId / :blogId inside the controller
const nestedRouter = express.Router({ mergeParams: true });

nestedRouter.get( "/", optionalAuth, ctrl.getComments);
nestedRouter.post("/", protect,      ctrl.createComment);

// ── Standalone router ──────────────────────────────────────────
// Mounted at /comments
const standaloneRouter = express.Router();
const { moderateComment } = require("../controllers/comment.controller");

// PATCH /api/v1/comments/:id/moderate
standaloneRouter.patch(
  "/:id/moderate",
  protect,
  restrictTo("super_admin", "admin"),
  ctrl.moderateComment
);

standaloneRouter.patch( "/:id", protect, ctrl.updateComment);
standaloneRouter.delete("/:id", protect, ctrl.deleteComment);
standaloneRouter.post( "/:id/like", protect, ctrl.likeComment);
standaloneRouter.post( "/:id/report", protect, ctrl.reportComment);

module.exports = { nestedRouter, standaloneRouter };