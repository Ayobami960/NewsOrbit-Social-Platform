const mongoose = require("mongoose");

/**
 * Blog — user-generated content (any registered user can post)
 * No moderation required — posts are immediately visible
 */
const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 200 },
    slug: { type: String, unique: true, lowercase: true, index: true },
    content: { type: String, required: true },
    excerpt: { type: String, maxlength: 400 },

    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tags: [String],

    featuredImage: {
      url:    String,
      fileId: String,
    },

    // Stats
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    readTime:{ type: Number, default: 0 },

    allowComments: { type: Boolean, default: true },

    // Soft delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
  },
  { timestamps: true }
);

// Removed status-based indexes — no longer needed
blogSchema.index({ author: 1, createdAt: -1 });
blogSchema.index({ createdAt: -1 });
blogSchema.index({ title: "text", excerpt: "text" });

blogSchema.pre("save", function (next) {
  if (this.isModified("content")) {
    const words = this.content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    this.readTime = Math.ceil(words / 200);
  }
  next();
});

blogSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) this.where({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model("Blog", blogSchema);