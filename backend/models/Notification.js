const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  type: {
    type: String, 
    required: true,
    enum: [
      "new_article",
      "new_blog", 
      "new_comment",
      "new_follower",
      "comment_reply",
      "breaking_news",
      "newsletter",
      "blog_approved",
      "blog_rejected",
      "new_contact",   
      "contact_reply",   
    ],
  },
  title:   { type: String, required: true, maxlength: 200 },
  body:    { type: String, maxlength: 500 },
  link:    String,
  article: { type: mongoose.Schema.Types.ObjectId, ref: "Article", default: null },
  blog:    { type: mongoose.Schema.Types.ObjectId, ref: "Blog",    default: null },
  comment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
  isRead: { type: Boolean, default: false, index: true },
  readAt: Date,
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 60 });

module.exports = mongoose.model("Notification", notificationSchema);