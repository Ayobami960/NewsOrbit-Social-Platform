const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    fileId: String,
    fileType: { type: String, enum: ["image", "video"] },
    caption: String,
    alt: String,
    width: Number,
    height: Number,
    size: Number,
  },
  { _id: false }
);

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 250 },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    content: { type: String, required: true },
    contentDelta: { type: Object },
    excerpt: { type: String, maxlength: 500 },

    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],

    featuredImage: mediaSchema,
    gallery: [mediaSchema],

    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    coAuthors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "archived"],
      default: "draft",
    },
    scheduledAt: Date,
    publishedAt: Date,

    isBreaking: { type: Boolean, default: false },
    breakingExpiresAt: Date,

    seo: {
      metaTitle: { type: String, maxlength: 70 },
      metaDescription: { type: String, maxlength: 160 },
      canonicalUrl: String,
      noIndex: { type: Boolean, default: false },
    },

    views:     { type: Number, default: 0 },
    readTime:  { type: Number, default: 0 },
    likes:     { type: Number, default: 0 },
    likedBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reactions: { type: Map, of: Number, default: {} },

    isFeatured:    { type: Boolean, default: false },
    isPinned:      { type: Boolean, default: false },
    allowComments: { type: Boolean, default: true },

    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// ====================== INDEXES ======================
articleSchema.index({ status: 1, publishedAt: -1 });
articleSchema.index({ category: 1, status: 1 });
articleSchema.index({ author: 1, status: 1 });
articleSchema.index({ isBreaking: 1, status: 1 });
articleSchema.index({ tags: 1 });
articleSchema.index({ likedBy: 1 });

// Text search index
articleSchema.index({ title: "text", excerpt: "text" }, {
  weights: { title: 10, excerpt: 5 },
});

// Common query indexes
articleSchema.index({ isFeatured: 1, status: 1 });
articleSchema.index({ createdAt: -1 });

// ====================== HOOKS ======================
articleSchema.pre("save", function (next) {
  if (this.isModified("content")) {
    const words = this.content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    this.readTime = Math.ceil(words / 200);
  }

  // Keep likes count in sync with likedBy array
  if (this.isModified("likedBy")) {
    this.likes = this.likedBy.length;
  }

  next();
});

articleSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model("Article", articleSchema);