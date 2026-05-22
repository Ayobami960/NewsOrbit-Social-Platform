const express = require("express");
const router = express.Router();
const multer = require("multer");
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

// CREATE: accepts featuredImage as binary — server will upload to ImageKit
const uploadForCreate = multer(baseOptions).fields([
  { name: "featuredImage", maxCount: 1 },
  { name: "gallery",       maxCount: 10 },
]);

// UPDATE: gallery only — featuredImage is NEVER a file on update.
// The frontend already uploaded it to ImageKit CDN and sends only
// featuredImageUrl + featuredImageFileId as plain text fields.
// Excluding featuredImage here means multer can never intercept it,
// so req.files.featuredImage is always undefined on PATCH → no server re-upload.
const uploadForUpdate = multer(baseOptions).fields([
  { name: "gallery", maxCount: 10 },
]);

// ─── Public ───────────────────────────────────────────────────────────────────
router.get("/", getArticles);
router.get("/breaking", getBreakingNews);
router.get("/:slug", getArticle);

// ─── Protected ────────────────────────────────────────────────────────────────
router.use(protect);

router.get("/my-stats", protect, restrictTo("super_admin","admin","writer"), getMyArticleStats);
router.get("/:id", getArticleById);

// validate() was previously passed the controller function as its argument —
// that's a bug (controllers aren't Joi schemas). Validation lives inside the
// controllers already via Joi, so the middleware is simply removed here.
router.post(  "/", uploadForCreate, createArticle);
router.patch( "/:id", uploadForUpdate, updateArticle);

router.delete("/:id",       deleteArticle);
router.post(  "/:id/react", reactToArticle);

module.exports = router;