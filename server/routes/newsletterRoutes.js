const router = require("express").Router();
const ctrl = require("../controllers/newsletter.controller");
const { protect, restrictTo } = require("../middlewares/auth");

// Public
router.post("/subscribe",  ctrl.subscribe);
router.get ("/unsubscribe", ctrl.unsubscribe);

// Admin

module.exports = router;