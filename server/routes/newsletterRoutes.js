const router = require("express").Router();
const ctrl = require("../controllers/newsletter.controller");
const { protect, restrictTo } = require("../middlewares/auth");

// Public
router.post("/subscribe",  ctrl.subscribe);
router.get ("/unsubscribe", ctrl.unsubscribe);

// Write access required
router.get ("/subscribers", protect, restrictTo("writer"), ctrl.getSubscribers);
router.post("/send", protect, restrictTo("writer"), ctrl.sendBroadcast);



module.exports = router;