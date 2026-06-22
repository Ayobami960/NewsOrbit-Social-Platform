
const mongoose = require("mongoose");

/**
 * One Conversation per regular USER.
 * 
 * participants = [userId, ...supportStaffIds]
 * Support staff = super_admin + any manager/admin who has joined the thread.
 * 
 * The conversation is "owned" by the user. Support staff can all see and
 * reply to it (like a shared inbox / Intercom-style).
 */
const conversationSchema = new mongoose.Schema(
  {
    // The regular user who opened this conversation
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one conversation per user
    },

    // All participants: user + every support agent who has ever replied
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Snapshot for the conversation list preview
    lastMessage: {
      body:      { type: String, default: "" },
      sender:    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      senderName:{ type: String, default: "" },
      createdAt: { type: Date, default: null },
    },

    // How many messages the USER hasn't read yet
    userUnread: { type: Number, default: 0 },

    // How many messages the SUPPORT TEAM hasn't read yet (from the user)
    supportUnread: { type: Number, default: 0 },

    // Which support agent last handled this (for display in admin list)
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
  },
  { timestamps: true }
);



module.exports = mongoose.model("Conversation", conversationSchema);
