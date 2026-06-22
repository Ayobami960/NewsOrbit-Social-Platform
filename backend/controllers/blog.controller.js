const Blog = require("../models/Blog");
const User = require("../models/User");
const { uploadToImageKit, deleteFromImageKit } = require("../lib/upload");
const { generateUniqueSlug } = require("../utils/slug");
const { sanitiseRichText, stripHtml } = require("../utils/sanitise");
const { sanitiseFilename } = require("../middlewares/upload");
const { log } = require("../models/ActivityLog");
const { notifyFollowersNewBlog } = require("../utils/notification");
const {
  sendSuccess, sendCreated,
  sendNotFound, sendForbidden, sendError,
} = require("../utils/apiResponse");

// ─────────────────────────────────────────────
// GET /api/v1/blog
// ─────────────────────────────────────────────
exports.getBlogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, author, search, sort = "-createdAt" } = req.query;

    const filter = { isDeleted: false };
    if (author) filter.author = author;
    if (search) filter.$text  = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("author", "_id name avatar")
        .select("-content -likedBy"),
      Blog.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      blogs,
      pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / +limit) },
    });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// GET /api/v1/blog/:slug
// ─────────────────────────────────────────────
exports.getBlogBySlug = async (req, res, next) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, isDeleted: false })
      .populate("author", "_id name avatar bio socialLinks");

    if (!blog) return sendNotFound(res, "Blog not found.");

    Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } }).exec();
    try {
      const authorId = blog.author?._id || blog.author;
      User.findByIdAndUpdate(authorId, { $inc: { "stats.totalViews": 1 } }).exec();
    } catch (e) {}

    const blogObj = blog.toObject();
    const likedBy = blogObj.likedBy || [];
    delete blogObj.likedBy;
    blogObj.isLiked = req.user
      ? likedBy.some(id => id.toString() === req.user._id.toString())
      : false;

    return sendSuccess(res, { blog: blogObj });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// GET /api/v1/blog/mine
// ─────────────────────────────────────────────
exports.getMyBlogs = async (req, res, next) => {
  try {
    const blogs = await Blog.find({ author: req.user._id, isDeleted: false })
      .sort("-createdAt")
      .select("-likedBy");
    return sendSuccess(res, { blogs });
  } catch (err) { next(err); }
};

exports.getBlogById = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate("author", "_id name avatar bio socialLinks")
      .populate("tags", "name slug");

    if (!blog) return sendNotFound(res, "Blog not found.");

    const isOwner = blog.author._id.toString() === req.user._id.toString();
    const isAdmin = ["super_admin", "admin", "writer"].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return sendError(res, "You can only access your own blogs.", 403);
    }

    return sendSuccess(res, { blog });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// GET /api/v1/blog/:id/likers  (owner / admin only)
// ─────────────────────────────────────────────
exports.getBlogLikers = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate("likedBy", "name avatar email")
      .select("likedBy likes author");

    if (!blog || blog.isDeleted) return sendNotFound(res, "Blog not found.");

    const isOwner = blog.author.toString() === req.user._id.toString();
    const isAdmin = ["super_admin", "admin"].includes(req.user.role);

    if (!isOwner && !isAdmin) return sendForbidden(res, "Access denied.");

    return sendSuccess(res, {
      likes:  blog.likes,
      likers: blog.likedBy,
      total:  blog.likedBy.length,
    });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// POST /api/v1/blog
// ─────────────────────────────────────────────
exports.createBlog = async (req, res, next) => {
  try {
    const { title, content, excerpt, tags } = req.body;

    const safeContent = sanitiseRichText(content || "");
    const slug        = await generateUniqueSlug(Blog, title);

    let featuredImage = null;
    const imageFile   = req.files?.featuredImage?.[0];
    if (imageFile) {
      const u = await uploadToImageKit(imageFile, {
        folder: "/blogs",
        fileNamePrefix: sanitiseFilename(imageFile.originalname.replace(/\.[^/.]+$/, "")),
      });
      featuredImage = { url: u.url, fileId: u.fileId };
    }

    const blog = await Blog.create({
      title:   stripHtml(title).slice(0, 200),
      slug,
      content: safeContent,
      excerpt: stripHtml(excerpt || "").slice(0, 400),
      tags:    Array.isArray(tags) ? tags.map(t => stripHtml(t).slice(0, 50)) : [],
      author:  req.user._id,
      featuredImage,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { "stats.totalBlogs": 1 } });

    log({
      user: req.user._id, action: "blog_create",
      resource: blog._id.toString(), resourceType: "Blog", ip: req.ip,
    });

    const authorData = await User.findById(req.user._id).select("name avatar");
    notifyFollowersNewBlog(blog, authorData).catch(() => {});

    return sendCreated(res, { blog }, "Blog published successfully.");
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// PATCH /api/v1/blog/:id
// ─────────────────────────────────────────────
exports.updateBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog || blog.isDeleted) return sendNotFound(res, "Blog not found.");
    if (blog.author.toString() !== req.user._id.toString())
      return sendForbidden(res, "Not your blog.");

    const { title, content, excerpt, tags } = req.body;
    if (title)   blog.title   = stripHtml(title).slice(0, 200);
    if (content) blog.content = sanitiseRichText(content);
    if (excerpt) blog.excerpt = stripHtml(excerpt).slice(0, 400);
    if (tags)    blog.tags    = Array.isArray(tags)
      ? tags.map(t => stripHtml(t).slice(0, 50)) : [];

    const imageFile = req.files?.featuredImage?.[0];
    if (imageFile) {
      if (blog.featuredImage?.fileId) {
        await deleteFromImageKit(blog.featuredImage.fileId).catch(() => {});
      }
      const u = await uploadToImageKit(imageFile, {
        folder: "/blogs",
        fileNamePrefix: sanitiseFilename(imageFile.originalname.replace(/\.[^/.]+$/, "")),
      });
      blog.featuredImage = { url: u.url, fileId: u.fileId };
    }

    await blog.save();

    log({ user: req.user._id, action: "blog_update", resource: blog._id.toString(), ip: req.ip });

    return sendSuccess(res, { blog }, "Blog updated successfully.");
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// DELETE /api/v1/blog/:id
// Permission matrix:
//   super_admin → can delete ANY blog (content violation, abuse, etc.)
//   admin       → can delete any blog (same moderation power)
//   user/writer → can only delete their OWN blog
// ─────────────────────────────────────────────
exports.deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return sendNotFound(res, "Blog not found.");

    const isSuperAdmin = req.user.role === "super_admin";
    const isAdmin      = req.user.role === "admin";
    const isOwner      = blog.author.toString() === req.user._id.toString();

    // super_admin has unconditional delete power (content violations, abuse, etc.)
    // admin also has moderation delete power
    // everyone else must own the blog
    if (!isSuperAdmin && !isAdmin && !isOwner) {
      return sendForbidden(res, "You do not have permission to delete this blog.");
    }

    if (blog.featuredImage?.fileId) {
      await deleteFromImageKit(blog.featuredImage.fileId).catch(() => {});
    }

    await Blog.findByIdAndDelete(req.params.id);

    await User.findByIdAndUpdate(blog.author, { $inc: { "stats.totalBlogs": -1 } });

    log({
      user:     req.user._id,
      action:   "blog_delete",
      resource: blog._id.toString(),
      meta: {
        deletedBy: req.user.role,
        // Flag when an admin/super_admin removes someone else's content
        contentModeration: !isOwner,
      },
      severity: !isOwner ? "warning" : "info",
      ip: req.ip,
    });

    return sendSuccess(res, {}, "Blog deleted successfully.");
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// POST /api/v1/blog/:id/like
// ─────────────────────────────────────────────
exports.likeBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog || blog.isDeleted) return sendNotFound(res, "Blog not found.");

    const userId       = req.user._id;
    const alreadyLiked = blog.likedBy.some(id => id.toString() === userId.toString());

    if (alreadyLiked) {
      blog.likedBy.pull(userId);
      blog.likes = Math.max(0, blog.likes - 1);
    } else {
      blog.likedBy.push(userId);
      blog.likes += 1;
    }

    await blog.save();

    try {
      await User.findByIdAndUpdate(blog.author, {
        $inc: { "stats.totalLikes": alreadyLiked ? -1 : 1 },
      }).exec();
    } catch (e) {}

    return sendSuccess(res, {
      likes:   blog.likes,
      isLiked: !alreadyLiked,
    }, alreadyLiked ? "Blog unliked." : "Blog liked.");
  } catch (err) { next(err); }
};
