const express = require("express");

const authRoutes     = require("./authRoutes");
const userRoutes     = require("./userRoutes");
const adminRoutes    = require("./adminRoutes");
const blogRoutes     = require("./blogRoutes");
const articleRoutes  = require("./articleRoutes");
const categoryRoutes = require("./categoryRoutes");
const newsletterRoutes = require("./newsletterRoutes");
const pushRoutes = require("./pushRoutes");
const followRoutes = require("./followRoutes");
const notificationRoutes = require("./notificationRoutes");



const { nestedRouter, standaloneRouter } = require("./commentRoutes");

const router = express.Router();

// ── Core routes ────────────────────────────────────────────────────────────────
router.use("/auth",       authRoutes);
router.use("/users",      userRoutes);
router.use("/admin",      adminRoutes);

// ── Comment routes ─────────────────────────────────────────────────────────────
// Nested  → /api/v1/articles/:articleId/comments
//         → /api/v1/blogs/:blogId/comments
//         → /api/v1/blog/:blogId/comments
// Standalone → /api/v1/comments/:id  (edit / delete / like / report)
router.use("/articles/:articleId/comments", nestedRouter);
router.use("/blogs/:blogId/comments",       nestedRouter);
router.use("/blog/:blogId/comments",        nestedRouter);
router.use("/comments",                     standaloneRouter);

router.use("/blog",      blogRoutes);
// router.use("/blogs",      blogRoutes);
router.use("/articles",   articleRoutes);
router.use("/categories", categoryRoutes);
router.use("/newsletter", newsletterRoutes);
router.use("/push", pushRoutes);
router.use("/user/follow", followRoutes);
router.use("/notifications", notificationRoutes);

// ── 404 fallback ───────────────────────────────────────────────────────────────
router.use((req, res) => {
  res.status(404).json({ success: false, error: "Endpoint not found" });
});

console.log("✅ All routes loaded successfully");
module.exports = router;