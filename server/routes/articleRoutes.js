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

// ─── Public ───────────────────────────────────────────────────────────────────
router.get("/breaking", getBreakingNews);
router.get("/",         optionalAuth, getArticles);
router.get("/:slug",      optionalAuth, getArticle);


// ─── Protected ────────────────────────────────────────────────────────────────
router.use(protect);

router.get("/my-stats",   restrictTo("super_admin", "admin", "writer"), getMyArticleStats);
router.get("/edit/:id",   getArticleById);
router.get("/:id/likers", restrictTo("super_admin", "admin", "writer"), getArticleLikers);

router.post("/",          uploadForCreate, createArticle);
router.patch("/:id",      uploadForUpdate, updateArticle);
router.delete("/:id",     deleteArticle);
router.post("/:id/react", reactToArticle);
router.post("/:id/like",  likeArticle);
module.exports = router;