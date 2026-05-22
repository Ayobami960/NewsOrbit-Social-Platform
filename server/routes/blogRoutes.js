const express = require("express");
const router  = express.Router();
const multer  = require("multer");

const { protect, restrictTo, optionalAuth } = require("../middlewares/auth");
const {
  getBlogs,
  getBlogBySlug,
  getMyBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  likeBlog,
} = require("../controllers/blog.controller");

// ── Multer ──────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images allowed"), false);
    }
  },
});

// ── Routes ───────────────────────────────────────────────
// ⚠️ /mine MUST come before /:slug — otherwise "mine" is treated as a slug
router.get("/mine",  protect,       getMyBlogs);
router.get("/",      optionalAuth,  getBlogs);
router.get("/:slug", optionalAuth,  getBlogBySlug);

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

router.delete("/:id",      protect, restrictTo("user"), deleteBlog);
router.post("/:id/like",   protect, likeBlog);

module.exports = router;