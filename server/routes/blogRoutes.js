const express = require("express");
const router  = express.Router();
const multer  = require("multer");

const { protect, restrictTo, optionalAuth } = require("../middlewares/auth");
const {
  getBlogs,
  getBlogBySlug,
  getMyBlogs,
  getBlogById,
  getBlogLikers,
  createBlog,
  updateBlog,
  deleteBlog,
  likeBlog,
} = require("../controllers/blog.controller");

// ── Multer ──────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"), false);
  },
});
// ── Routes ───────────────────────────────────────────────
// ⚠️ Specific paths before parameterised ones
router.get("/mine", protect, getMyBlogs);
router.get("/", optionalAuth, getBlogs);

// ── Public: fetch by slug ─────────────────────────────────
router.get("/slug/:slug", optionalAuth, getBlogBySlug);      // ✅ distinct prefix

// ── Authenticated: fetch by ID (owner/admin edit view) ────
router.get("/:id", protect, getBlogById);
router.delete("/:id", protect, deleteBlog);
router.post("/:id/like", protect, likeBlog);
router.get("/:id/likers", protect, restrictTo("super_admin", "admin", "writer", "user"), getBlogLikers);

router.post(
  "/",
  protect,
  upload.fields([{ name: "featuredImage", maxCount: 1 }]),
  createBlog
);

router.patch(
  "/:id",
  protect,
  upload.fields([{ name: "featuredImage", maxCount: 1 }]),
  updateBlog
);

module.exports = router;
module.exports = router;