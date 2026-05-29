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
  getBreakingNews,
  deleteArticle,
  reactToArticle,
  getMyArticleStats,
  getArticleLikers,
  likeArticle,
} = require("../controllers/article.controller");

// ─── Multer ───────────────────────────────────────────────────────────────────
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed!"), false);
};

const baseOptions = {
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFilter,
};

const uploadForCreate = multer(baseOptions).fields([
  { name: "featuredImage", maxCount: 1 },
  { name: "gallery",       maxCount: 10 },
]);

const uploadForUpdate = multer(baseOptions).fields([
  { name: "featuredImage", maxCount: 1 },
  { name: "gallery",       maxCount: 10 },
]);
// ─── Public static routes FIRST ──────────────────────────────────────────────
router.get("/breaking",   getBreakingNews);
router.get("/my-stats",   protect, restrictTo("super_admin", "admin", "writer"), getMyArticleStats);
router.get("/edit/:id",   protect, getArticleById);

// ─── Public wildcard routes AFTER specific ones ───────────────────────────────
router.get("/",           optionalAuth, getArticles);
router.get("/:slug",      optionalAuth, getArticle);  // ← must be last GET

// ─── Protected mutation routes ────────────────────────────────────────────────
router.get("/:id/likers", protect, restrictTo("super_admin", "admin", "writer"), getArticleLikers);
router.post("/",          protect, uploadForCreate, createArticle);
router.patch("/:id",      protect, uploadForUpdate, updateArticle);
router.delete("/:id",     protect, deleteArticle);
router.post("/:id/react", protect, reactToArticle);
router.post("/:id/like",  protect, likeArticle);

module.exports = router;
module.exports = router;