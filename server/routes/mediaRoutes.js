const router = require("express").Router();
const ctrl = require("../controllers/media.controller");
const { protect, restrictTo } = require("../middlewares/auth");
const { uploadSingleImage } = require("../middlewares/upload");

router.use(protect);

router.get ("/auth",        ctrl.getUploadAuth);
router.post("/upload",      uploadSingleImage, ctrl.uploadMedia);
router.delete("/:fileId",   restrictTo("admin", "super_admin"), ctrl.deleteMedia);

module.exports = router;