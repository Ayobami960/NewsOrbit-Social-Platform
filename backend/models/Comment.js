
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    // Can comment on article OR blog
    article: { type: mongoose.Schema.Types.ObjectId, ref: "Article", default: null, index: true },
    blog:    { type: mongoose.Schema.Types.ObjectId, ref: "Blog",    default: null, index: true },

    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },

    // Plain text only — no HTML
    body: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "spam"],
      default: "approved",
      index: true,
    },
   
    likes:   { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    reports: [{
      reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reason: String, at: { type: Date, default: Date.now },
    }],

    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    editedAt:  Date,
    isEdited:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

commentSchema.index({ article: 1, status: 1, createdAt: -1 });
commentSchema.index({ blog: 1, status: 1, createdAt: -1 });
commentSchema.index({ parent: 1 });

commentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  if (obj.isDeleted) obj.body = "[deleted]";
  return obj;
};

module.exports = mongoose.model("Comment", commentSchema);