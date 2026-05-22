const Blog = require("../models/Blog");
const User = require("../models/User");
const { uploadToImageKit, deleteFromImageKit } = require("../lib/upload");
const { generateUniqueSlug } = require("../utils/slug");
const { sanitiseRichText, stripHtml } = require("../utils/sanitise");
const { sanitiseFilename } = require("../middlewares/upload");
const { log }  = require("../models/ActivityLog");
const {
  sendSuccess, sendCreated,
  sendNotFound, sendForbidden,
} = require("../utils/apiResponse");

// ─────────────────────────────────────────────
// GET /api/v1/blogs
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
        .populate("author", "name avatar")
        .select("-content -likedBy"), // don't leak likedBy array
      Blog.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      blogs,
      pagination: {
        page:  +page,
        limit: +limit,
        total,
        pages: Math.ceil(total / +limit),
      },
    });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// GET /api/v1/blogs/:slug
// ─────────────────────────────────────────────
exports.getBlogBySlug = async (req, res, next) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, isDeleted: false })
      .populate("author", "name avatar bio socialLinks");

    if (!blog) return sendNotFound(res, "Blog not found.");

    // Background view increment — don't await
    Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } }).exec();

    // Attach isLiked for authenticated requests
    const blogObj = blog.toObject();
    delete blogObj.likedBy; // don't expose who liked
    blogObj.isLiked = req.user
      ? blog.likedBy.some(id => id.toString() === req.user._id.toString())
      : false;

    return sendSuccess(res, { blog: blogObj });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// GET /api/v1/blogs/mine
// ─────────────────────────────────────────────
exports.getMyBlogs = async (req, res, next) => {
  try {
    const blogs = await Blog.find({ author: req.user._id, isDeleted: false })
      .sort("-createdAt")
      .select("-likedBy");
    return sendSuccess(res, { blogs });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// POST /api/v1/blogs
// ─────────────────────────────────────────────
exports.createBlog = async (req, res, next) => {
  try {
    const { title, content, excerpt, tags } = req.body;

    const safeContent = sanitiseRichText(content || "");
    const slug        = await generateUniqueSlug(Blog, title);

    let featuredImage = null;
    const imageFile   = req.files?.featuredImage?.[0];
    if (imageFile) {
      // ✅ Pass full file object + options
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

    return sendCreated(res, { blog }, "Blog published successfully.");
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// PATCH /api/v1/blogs/:id
// ─────────────────────────────────────────────
exports.updateBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id);
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
      // ✅ Delete old image from ImageKit first
      if (blog.featuredImage?.fileId) {
        await deleteFromImageKit(blog.featuredImage.fileId).catch(() => {});
      }

      // ✅ Pass full file object + options
      const u = await uploadToImageKit(imageFile, {
        folder: "/blogs",
        fileNamePrefix: sanitiseFilename(imageFile.originalname.replace(/\.[^/.]+$/, "")),
      });

      // ✅ Update featuredImage in the document (saves to DB on blog.save())
      blog.featuredImage = { url: u.url, fileId: u.fileId };
    }

    await blog.save(); // ✅ featuredImage change persisted here

    log({ user: req.user._id, action: "blog_update", resource: blog._id.toString(), ip: req.ip });

    return sendSuccess(res, { blog }, "Blog updated successfully.");
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// DELETE /api/v1/blogs/:id
// ─────────────────────────────────────────────
exports.deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return sendNotFound(res, "Blog not found.");

    const isOwner = blog.author.toString() === req.user._id.toString();
    const isAdmin = ["super_admin", "admin"].includes(req.user.role);
    if (!isOwner && !isAdmin) return sendForbidden(res, "Not allowed.");

    // Delete image from ImageKit
    if (blog.featuredImage?.fileId) {
      await deleteFromImageKit(blog.featuredImage.fileId).catch(() => {});
    }

    // Hard delete from DB
    await Blog.findByIdAndDelete(req.params.id);

    await User.findByIdAndUpdate(blog.author, { $inc: { "stats.totalBlogs": -1 } });

    log({ user: req.user._id, action: "blog_delete", resource: blog._id.toString(), ip: req.ip });

    return sendSuccess(res, {}, "Blog deleted successfully.");
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// POST /api/v1/blogs/:id/like
// ─────────────────────────────────────────────
exports.likeBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog || blog.isDeleted) return sendNotFound(res, "Blog not found.");

    const userId      = req.user._id;
    // .includes() fails on ObjectId arrays — use .some() with toString()
    const alreadyLiked = blog.likedBy.some(id => id.toString() === userId.toString());

    if (alreadyLiked) {
      blog.likedBy.pull(userId);
      blog.likes = Math.max(0, blog.likes - 1);
    } else {
      blog.likedBy.push(userId);
      blog.likes += 1;
    }

    await blog.save();

    return sendSuccess(res, {
      likes:   blog.likes,
      isLiked: !alreadyLiked,
    }, alreadyLiked ? "Blog unliked." : "Blog liked.");
  } catch (err) { next(err); }
};