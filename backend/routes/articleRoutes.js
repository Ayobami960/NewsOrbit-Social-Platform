const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const { protect, restrictTo, optionalAuth } = require("../middlewares/auth");

const {
  createArticle,
  updateArticle,
  getArticles,
  getArticle,
  getArticleById,
  getArticleBySlug,
  getBreakingNews,
  deleteArticle,
  reactToArticle,
  getMyArticleStats,
  getArticleLikers,
  likeArticle,
} = require("../controllers/article.controller");

// ─── Multer ───────────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed!"), false);
  },
}).fields([
  { name: "featuredImage", maxCount: 1  },
  { name: "gallery",       maxCount: 10 },
]);

// ─── 1. Exact static routes (no params) ──────────────────────────────────────
router.get( "/",          optionalAuth, getArticles);
router.post("/",          protect, restrictTo("writer"), upload, createArticle);

// ─── 2. Named-prefix routes (won't collide with /:id wildcards) ──────────────
router.get("/breaking",   getBreakingNews);
router.get("/my-stats",   protect, restrictTo("super_admin", "admin", "writer"), getMyArticleStats);

// GET /articles/slug/:slug  — public reader view (by slug)
router.get("/slug/:slug", optionalAuth, getArticle);

// GET /articles/edit/:id  — writer/admin edit view (by ObjectId, protected)
router.get("/edit/:id",   protect, restrictTo("super_admin", "admin", "writer"), getArticleById);

// ─── 3. Wildcard /:id routes (ObjectId — last among GETs) ────────────────────
router.get("/:id/likers", protect, restrictTo("super_admin", "admin", "writer"), getArticleLikers);
router.get("/:id",        optionalAuth, getArticleBySlug);   // handles both id & slug fallback

// ─── 4. Mutation routes ───────────────────────────────────────────────────────
router.patch( "/:id",      protect, upload, updateArticle);
router.delete("/:id",      protect, deleteArticle);
router.post(  "/:id/like", protect, likeArticle);
router.post(  "/:id/react",protect, reactToArticle);

module.exports = router;
