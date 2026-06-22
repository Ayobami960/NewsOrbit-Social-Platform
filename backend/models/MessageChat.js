// backend/models/Message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // "user" | "support"  — lets the client style bubbles correctly
    // without needing to know the exact role
    senderType: {
      type: String,
      enum: ["user", "support"],
      required: true,
    },

    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    // Timestamp when the user read this message (null = unread)
    readAt: {
      type: Date,
      default: null,  
    },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
