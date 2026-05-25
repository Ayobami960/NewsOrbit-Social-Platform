const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const { protect, restrictTo } = require("../middlewares/auth");

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
  { name: "gallery", maxCount: 10 },
]);

// ─── Public ───────────────────────────────────────────────────────────────────
router.get("/",        getArticles);
router.get("/breaking", getBreakingNews);
router.get("/:slug", getArticle);   // Public route to get article by slug - must come before protect middleware

// ─── Protected ────────────────────────────────────────────────────────────────
router.use(protect);

router.get("/my-stats", restrictTo("super_admin", "admin", "writer"), getMyArticleStats);
router.get("/:id", getArticleById);  // Protected route to get article by ID (for editors/admins)
router.post(  "/",  uploadForCreate, createArticle);
router.patch( "/:id", uploadForUpdate, updateArticle);
router.delete("/:id", deleteArticle);
router.post(  "/:id/react", reactToArticle);
router.post(  "/:id/like", likeArticle);

module.exports = router;