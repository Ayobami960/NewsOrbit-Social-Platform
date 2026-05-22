const express = require("express");

const authRoutes     = require("./authRoutes");
const userRoutes     = require("./userRoutes");
const adminRoutes    = require("./adminRoutes");
const blogRoutes     = require("./blogRoutes");
const articleRoutes  = require("./articleRoutes");
const categoryRoutes = require("./categoryRoutes");

const { nestedRouter, standaloneRouter } = require("./commentRoutes");

const router = express.Router();

// ── Core routes ────────────────────────────────────────────────────────────────
router.use("/auth",       authRoutes);
router.use("/users",      userRoutes);
router.use("/admin",      adminRoutes);
router.use("/blog",      blogRoutes);
router.use("/articles",   articleRoutes);
router.use("/categories", categoryRoutes);

// ── Comment routes ─────────────────────────────────────────────────────────────
// Nested  → /api/v1/articles/:articleId/comments
//         → /api/v1/blogs/:blogId/comments
// Standalone → /api/v1/comments/:id  (edit / delete / like / report)
router.use("/articles/:articleId/comments", nestedRouter);
router.use("/blogs/:blogId/comments",       nestedRouter);
router.use("/comments",                     standaloneRouter);

// ── 404 fallback ───────────────────────────────────────────────────────────────
router.use((req, res) => {
  res.status(404).json({ success: false, error: "Endpoint not found" });
});

console.log("✅ All routes loaded successfully");
module.exports = router;