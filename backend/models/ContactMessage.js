const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
  body:      { type: String, required: true },
  repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  repliedAt: { type: Date, default: Date.now },
});

const contactMessageSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    email:   { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    topic:   {
      type: String,
      enum: ["general", "editorial", "bug", "partnership", "press", "other"],
      default: "general",
    },
    status: {
      type: String,
      enum: ["unread", "read", "replied", "archived"],
      default: "unread",
    },
    reply:    { type: replySchema, default: null },
    // If the sender is a registered user, link them
    user:     { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);


module.exports = mongoose.model("ContactMessage", contactMessageSchema);