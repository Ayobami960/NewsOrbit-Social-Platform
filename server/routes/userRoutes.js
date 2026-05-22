const express = require("express");
const router = express.Router();
const multer = require("multer");

const { protect } = require("../middlewares/auth");
const {
  getMe, // ← New: Full profile for logged-in user
  getPublicProfile,
  updateProfile,
  // getUser,
} = require("../controllers/user.controller");

// Multer Setup
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

// ====================== USER ROUTES ======================

// Full profile - for logged in user (after login, dashboard, etc.)
router.get("/profile", protect, getMe);

// Public profile - no auth needed (for footer, author cards, profile page)
router.get("/public/:id", getPublicProfile);
// router.get("/profile", protect, getUser);
// Update own profile
router.patch(
  "/profile",
  protect,
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  updateProfile
);

module.exports = router;