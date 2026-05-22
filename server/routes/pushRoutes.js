const router = require("express").Router();
const pushCtrl = require("../controllers/push.controller");
const { protect, restrictTo, optionalAuth } = require("../middlewares/auth");

router.get   ("/vapid-public-key",  pushCtrl.getPublicKey);
router.post  ("/subscribe",  optionalAuth, pushCtrl.subscribe);
router.delete("/unsubscribe",  pushCtrl.unsubscribe);
router.post  ("/broadcast",  protect, restrictTo("admin","writer"), pushCtrl.broadcast);

module.exports = router;