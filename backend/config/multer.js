const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

// For Articles
router.post(
  "/articles",
  protect,
  upload.fields([
    { name: "featuredImage", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  createArticle
);

// For Profile Picture
router.patch(
  "/profile",
  protect,
  upload.single("avatar"),
  updateProfile
);