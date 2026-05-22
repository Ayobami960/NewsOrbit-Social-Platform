const express = require("express");
const router = express.Router();
const notifCtrl = require("../controllers/notification.controller");
const { protect } = require("../middlewares/auth");


router.get   ("/",           protect,  notifCtrl.getMyNotifications);
router.patch ("/read-all",  protect,  notifCtrl.markAllAsRead);
router.patch ("/:id/read",  protect,  notifCtrl.markAsRead);
router.delete("/:id",       protect,  notifCtrl.deleteNotification);

module.exports = router;