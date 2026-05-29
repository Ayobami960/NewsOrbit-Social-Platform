const router = require("express").Router();
const ctrl = require("../controllers/category.controller");
const { protect, restrictTo } = require("../middlewares/auth");

// Public
router.get("/", ctrl.getCategories);
router.get("/:slug", ctrl.getCategory);

// Admin
router.post  ("/", protect, restrictTo("super_admin", "admin"),  ctrl.createCategory);
router.patch ("/:id",protect, restrictTo("super_admin", "admin"), ctrl.updateCategory);
router.delete("/:id", protect, restrictTo("super_admin", "admin"), ctrl.deleteCategory);

module.exports = router;