
// ─── notification.controller.js ───────────────────────────
const Notification = require("../models/Notification");
const { sendSuccess, sendNotFound } = require("../utils/apiResponse");

exports.getMyNotifications = async (req, res, next) => {
  try {
    const { page=1, limit=20, unreadOnly } = req.query;
    const filter = { recipient:req.user._id };
    if (unreadOnly === "true") filter.isRead = false;
    const skip = (+page-1)*+limit;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort("-createdAt").skip(skip).limit(+limit)
        .populate("sender","name avatar")
        .populate("article","title slug")
        .populate("blog","title slug"),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient:req.user._id, isRead:false }),
    ]);
    return sendSuccess(res, { notifications, total, unreadCount });
  } catch (err) { next(err); }
};
exports.markAsRead = async (req, res, next) => {
  try {
    const n = await Notification.findOneAndUpdate({ _id:req.params.id, recipient:req.user._id }, { isRead:true, readAt:new Date() }, { new:true });
    if (!n) return sendNotFound(res, "Notification not found.");
    return sendSuccess(res, { notification:n }, "Marked as read.");
  } catch (err) { next(err); }
};
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient:req.user._id, isRead:false }, { isRead:true, readAt:new Date() });
    return sendSuccess(res, {}, "All marked as read.");
  } catch (err) { next(err); }
};
exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id:req.params.id, recipient:req.user._id });
    return sendSuccess(res, {}, "Deleted.");
  } catch (err) { next(err); }
};

module.exports.notificationController = { getMyNotifications: exports.getMyNotifications, markAsRead: exports.markAsRead, markAllAsRead: exports.markAllAsRead, deleteNotification: exports.deleteNotification };
