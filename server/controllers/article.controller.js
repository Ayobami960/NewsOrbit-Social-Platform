const Article = require("../models/Article");
const Category = require("../models/Category");
const Tag = require("../models/Tags");
const User = require("../models/User");

const { createArticle: createArticleValidator, updateArticle: updateArticleValidator } = require("../Validators/article.validator");
const { uploadToImageKit, deleteFromImageKit } = require("../lib/upload");
const { sanitiseRichText } = require("../utils/sanitise");
const { generateUniqueSlug, toSlug } = require("../utils/slug");
const { sendSuccess, sendCreated, sendError, sendNotFound } = require("../utils/apiResponse");
const { log } = require("../models/ActivityLog");
const { notifyFollowersNewArticle, broadcastBreakingNews } = require("../utils/notification");

const isObjectId = (value) => typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resolveCategoryId = async (categoryInput) => {
  if (!categoryInput) return null;
  if (isObjectId(categoryInput)) return categoryInput;

  const normalized = categoryInput.trim().toLowerCase();
  const category = await Category.findOne({
    $or: [
      { slug: normalized },
      { name: { $regex: new RegExp(`^${escapeRegex(categoryInput)}$`, "i") } },
    ],
  }).select("_id").lean();

  return category ? category._id : null;
};

// ====================== HELPER FUNCTIONS ======================

// Delete old image when replaced or removed
const deleteOldMedia = async (oldMedia) => {
  if (oldMedia?.fileId) {
    await deleteFromImageKit(oldMedia.fileId);
  }
};

// Delete old gallery images that are no longer used
const deleteOldGallery = async (oldGallery, newGallery = []) => {
  if (!oldGallery?.length) return;

  const newFileIds = new Set(newGallery.map(img => img?.fileId).filter(Boolean));

  for (const img of oldGallery) {
    if (img?.fileId && !newFileIds.has(img.fileId)) {
      await deleteFromImageKit(img.fileId);
    }
  }
};

// ====================== GET MY ARTICLE STATS ======================
const getMyArticleStats = async (req, res, next) => {
  try {
    const filter = { author: req.user._id, isDeleted: false };

    const [total, published, draft, viewsResult] = await Promise.all([
      Article.countDocuments(filter),
      Article.countDocuments({ ...filter, status: "published" }),
      Article.countDocuments({ ...filter, status: "draft" }),
      Article.aggregate([{ $match: filter }, { $group: { _id: null, views: { $sum: "$views" } } }]),
    ]);

    const topArticles = await Article.find({ ...filter, status: "published" })
      .sort("-views")
      .limit(5)
      .select("title slug views publishedAt featuredImage");

    return sendSuccess(res, {
      total,
      published,
      draft,
      totalViews: viewsResult[0]?.views || 0,
      topArticles,
    });
  } catch (err) {
    next(err);
  }
};

// ====================== GET ALL ARTICLES ======================
// const getArticles = async (req, res, next) => {
//   try {
//     const { page = 1, limit = 20, category, tag, status = "published", author, search, sort = "-publishedAt", isBreaking } = req.query;

//     const filter = { isDeleted: false };
//     const isPrivileged = req.user && ["super_admin", "admin", "writer"].includes(req.user.role);

//     if (!isPrivileged) filter.status = "published";
//     else if (status) filter.status = status;

//     if (category) filter.category = category;
//     if (tag) filter.tags = tag;
//     if (author) filter.author = author;
//     if (isBreaking === "true") filter.isBreaking = true;
//     if (search) filter.$text = { $search: search };

//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     const [articles, total] = await Promise.all([
//       Article.find(filter)
//         .sort(sort)
//         .skip(skip)
//         .limit(parseInt(limit))
//         .populate("author", "name avatar stats.totalArticles")
//         .populate("category", "name slug color")
//         .select("-content -contentDelta"),
//       Article.countDocuments(filter),
//     ]);

//     return sendSuccess(res, {
//       articles,
//       pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / +limit) },
//     });
//   } catch (err) {
//     next(err);
//   }
// };

const getArticles = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, tag, status = "published", author, search, sort = "-publishedAt" } = req.query;

    const filter = { isDeleted: false };
    const userRole = req.user?.role;

    // Writers should only see their own articles by default
    if (userRole === "writer") {
      filter.author = req.user._id;
    }

    if (status) filter.status = status;
    if (category) {
      const categoryId = await resolveCategoryId(category);
      if (!categoryId) {
        return sendSuccess(res, {
          articles: [],
          pagination: { page: +page, limit: +limit, total: 0, pages: 0 },
        });
      }
      filter.category = categoryId;
    }
    if (tag) filter.tags = tag;
    if (author) filter.author = author;
    if (search) filter.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [articles, total] = await Promise.all([
      Article.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("author", "name avatar")
        .populate("category", "name slug color"),
      Article.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      articles,
      pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / +limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ====================== GET ARTICLE BY SLUG (Public) ======================
const getArticle = async (req, res, next) => {
  try {
    const article = await Article.findOne({
      slug: req.params.slug,
      status: "published",
      isDeleted: false,
    })
      .populate("author", "name avatar bio socialLinks stats followersCount")
      .populate("category", "name slug color")
      .populate("tags", "name slug");

    if (!article) return sendNotFound(res, "Article not found.");

    Article.findByIdAndUpdate(article._id, { $inc: { views: 1 } }).exec();

    return sendSuccess(res, { article });
  } catch (err) {
    next(err);
  }
};

// ====================== GET BREAKING NEWS ======================
const getBreakingNews = async (req, res, next) => {
  try {
    const articles = await Article.find({
      isBreaking: true,
      status: "published",
      isDeleted: false,
      $or: [{ breakingExpiresAt: { $gt: new Date() } }, { breakingExpiresAt: null }],
    })
      .sort("-publishedAt")
      .limit(10)
      .select("title slug publishedAt featuredImage category")
      .populate("category", "name slug");

    return sendSuccess(res, { articles });
  } catch (err) {
    next(err);
  }
};

// ====================== GET ARTICLE BY ID (For Editor) ======================
// const getArticleById = async (req, res, next) => {
//   try {
//     const article = await Article.findOne({ _id: req.params.id})
//       .populate("author", "name avatar bio socialLinks stats followersCount")
//       .populate("category", "name slug color")
//       .populate("tags", "name slug");

//     if (!article) return sendNotFound(res, "Article not found.");

//     if (req.user?.role === "writer" && article.author._id.toString() !== req.user._id.toString()) {
//       return sendError(res, "You can only view your own articles.", 403);
//     }

//     if (article.status === "published") {
//       Article.findByIdAndUpdate(article._id, { $inc: { views: 1 } }).exec();
//     }

//     return sendSuccess(res, { article });
//   } catch (err) {
//     next(err);
//   }
// };

const getArticleById = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate("author", "name avatar bio socialLinks stats")
      .populate("category", "name slug color")
      .populate("tags", "name slug");

    if (!article) return sendNotFound(res, "Article not found.");

    const isOwner = article.author._id.toString() === req.user._id.toString();
    const isAdmin = ["super_admin", "admin"].includes(req.user.role);

    // Writers can only view/edit their own articles
    if (req.user.role === "writer" && !isOwner && !isAdmin) {
      return sendError(res, "You can only access your own articles.", 403);
    }

    return sendSuccess(res, { article });
  } catch (err) {
    next(err);
  }
};

// ====================== CREATE ARTICLE ======================
const createArticle = async (req, res, next) => {
  try {
    const { error, value } = createArticleValidator.validate(req.body, { abortEarly: false });
    if (error) return sendError(res, error.details.map(e => e.message), 400);

    const body = { ...value };
    if (body.content) body.content = sanitiseRichText(body.content);

    if (body.category) {
      const categoryId = await resolveCategoryId(body.category);
      if (!categoryId) return sendError(res, "Invalid category.", 400);
      body.category = categoryId;
    }

    const slug = await generateUniqueSlug(Article, body.title);

    // Handle Tags
    let tagIds = [];
    if (body.tags?.length) {
      tagIds = await Promise.all(
        body.tags.map(async (tagInput) => {
          if (/^[a-f\d]{24}$/i.test(tagInput)) return tagInput;
          let tag = await Tag.findOne({ name: { $regex: new RegExp(`^${tagInput}$`, "i") } });
          if (!tag) tag = await Tag.create({ name: tagInput.trim(), slug: toSlug(tagInput) });
          return tag._id;
        })
      );
    }

    // ====================== FEATURED IMAGE HANDLING ======================
    //
    // Two paths:
    //   A) req.files?.featuredImage  → server received the file, upload it to ImageKit now
    //   B) req.body.featuredImageUrl → frontend already uploaded to ImageKit CDN directly;
    //      just build the mediaSchema object from the URL + fileId the frontend sent
    //
    let featuredImage = null;

    if (req.files?.featuredImage?.[0]) {
      // Path A: file was sent to the server — upload to ImageKit
      featuredImage = await uploadToImageKit(req.files.featuredImage[0], {
        folder: "/articles/featured",
        fileNamePrefix: `article-${slug}`,
        alt: body.title,
        caption: body.excerpt || "",
      });
    } else if (body.featuredImageUrl) {
      // Path B: frontend already uploaded to ImageKit; store the URL + fileId as-is
      featuredImage = {
        url:    body.featuredImageUrl,
        fileId: body.featuredImageFileId || "",
        fileType: "image",
        alt:    body.title,
        caption: body.excerpt || "",
      };
    }

    const gallery = [];
    if (req.files?.gallery?.length) {
      for (const file of req.files.gallery) {
        const img = await uploadToImageKit(file, {
          folder: "/articles/gallery",
          fileNamePrefix: "gallery",
        });
        if (img) gallery.push(img);
      }
    }

    const isPublishing = body.status === "published";

    const article = await Article.create({
      ...body,
      slug,
      tags: tagIds,
      author: req.user._id,
      featuredImage,
      gallery,
      publishedAt: isPublishing ? new Date() : undefined,
    });

    // Update counters
    if (tagIds.length) await Tag.updateMany({ _id: { $in: tagIds } }, { $inc: { usageCount: 1 } });
    await User.findByIdAndUpdate(req.user._id, { $inc: { "stats.totalArticles": 1 } });

    log({
      user: req.user._id,
      action: "article_create",
      resource: article._id.toString(),
      resourceType: "Article",
      ip: req.ip,
    });

    if (isPublishing) {
      const authorData = await User.findById(req.user._id).select("name avatar");
      notifyFollowersNewArticle(article, authorData).catch(() => {});
      if (article.isBreaking) broadcastBreakingNews(article).catch(() => {});
    }

    return sendCreated(res, { article }, "Article created successfully.");
  } catch (err) {
    next(err);
  }
};


// ====================== UPDATE ARTICLE ======================
const updateArticle = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return sendNotFound(res, "Article not found.");

    const isOwner = article.author.toString() === req.user._id.toString();
    const isAdmin = ["super_admin", "admin"].includes(req.user.role);

    // Permission Check
    if (req.user.role === "writer") {
      if (!isOwner) {
        return sendError(res, "You can only edit your own articles.", 403);
      }
    } else if (!isAdmin) {
      return sendError(res, "Access denied.", 403);
    }

    // 1. Prepare and Sanitize Array Fields from FormData
    const rawBody = { ...req.body };
    const arrayFields = ["tags", "gallery", "categories"];

    for (const field of arrayFields) {
      if (typeof rawBody[field] === "string") {
        try {
          rawBody[field] = JSON.parse(rawBody[field].replace(/'/g, '"'));
        } catch {
          rawBody[field] = rawBody[field].split(",").map((v) => v.trim()).filter(Boolean);
        }
      }
    }

    const { error, value } = updateArticleValidator.validate(rawBody, { abortEarly: false });
    if (error) return sendError(res, error.details.map(e => e.message), 400);

    const body = { ...value };
    if (body.content) body.content = sanitiseRichText(body.content);

    if (body.category !== undefined) {
      const categoryId = await resolveCategoryId(body.category);
      if (!categoryId) return sendError(res, "Invalid category.", 400);
      body.category = categoryId;
    }

    // Process tags → ObjectIds
    let tagIds = undefined;
    if (body.tags !== undefined) {
      tagIds = [];
      if (Array.isArray(body.tags) && body.tags.length) {
        tagIds = await Promise.all(
          body.tags.map(async (tagInput) => {
            if (/^[a-f\d]{24}$/i.test(tagInput)) return tagInput;
            let tag = await Tag.findOne({ name: { $regex: new RegExp(`^${tagInput}$`, "i") } });
            if (!tag) tag = await Tag.create({ name: tagInput.trim(), slug: toSlug(tagInput) });
            return tag._id;
          })
        );
      }
    }

    // ====================== FEATURED IMAGE HANDLING ======================
    //
    // Three cases on update:
    //   A) req.files?.featuredImage  → new file sent to server; delete old, upload new
    //   B) body.featuredImageUrl set → frontend re-uploaded or kept existing CDN image;
    //      if the fileId differs from what's stored, delete the old one
    //   C) body.featuredImageUrl is "" / not present → user removed the image; delete old
    //
    let featuredImage = undefined; // undefined = "don't touch the field"

    if (req.files?.featuredImage?.[0]) {
      // Path A: new file sent to server
      if (article.featuredImage?.fileId) await deleteOldMedia(article.featuredImage);
      featuredImage = await uploadToImageKit(req.files.featuredImage[0], {
        folder: "/articles/featured",
        fileNamePrefix: `article-${article.slug}`,
      });

    } else if (body.featuredImageUrl) {
      // Path B: frontend has a CDN URL (either newly uploaded or unchanged existing)
      const incomingFileId = body.featuredImageFileId || "";

      if (article.featuredImage?.fileId && article.featuredImage.fileId !== incomingFileId) {
        // A *different* image was uploaded — delete the old one from ImageKit
        await deleteOldMedia(article.featuredImage);
      }

      featuredImage = {
        url:      body.featuredImageUrl,
        fileId:   incomingFileId,
        fileType: "image",
        alt:      article.featuredImage?.alt || "",
        caption:  article.featuredImage?.caption || "",
      };

    } else if (body.featuredImageUrl === "" || body.featuredImageUrl === null) {
      // Path C: image was explicitly cleared by the user
      if (article.featuredImage?.fileId) await deleteOldMedia(article.featuredImage);
      featuredImage = null;
    }
    // If body.featuredImageUrl is simply absent (undefined), featuredImage stays
    // undefined and we don't overwrite what's already stored.

    // Gallery (server-upload path only — unchanged from original)
    let gallery = value.gallery;
    if (req.files?.gallery?.length) {
      await deleteOldGallery(article.gallery, value.gallery || []);
      const newGalleryUploads = [];
      for (const file of req.files.gallery) {
        const img = await uploadToImageKit(file, { folder: "/articles/gallery" });
        if (img) newGalleryUploads.push(img);
      }
      gallery = [...(gallery || []), ...newGalleryUploads];
    }

    // Update slug if title changed
    if (body.title && body.title !== article.title) {
      body.slug = await generateUniqueSlug(Article, body.title, article._id);
    }

    const becomesPublished = body.status === "published" && article.status !== "published";
    if (becomesPublished) body.publishedAt = new Date();

    // Build final update payload
    const updateData = { ...body };
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
    if (gallery !== undefined)       updateData.gallery = gallery;
    if (tagIds !== undefined)        updateData.tags = tagIds;

    const updated = await Article.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (tagIds !== undefined && tagIds.length) {
      await Tag.updateMany({ _id: { $in: tagIds } }, { $inc: { usageCount: 1 } });
    }

    log({
      user: req.user._id,
      action: "article_update",
      resource: article._id.toString(),
      ip: req.ip,
    });

    if (becomesPublished) {
      const authorData = await User.findById(req.user._id).select("name avatar");
      notifyFollowersNewArticle(updated, authorData).catch(() => {});
      if (updated.isBreaking) broadcastBreakingNews(updated).catch(() => {});
    }

    return sendSuccess(res, { article: updated }, "Article updated successfully.");
  } catch (err) {
    next(err);
  }
};

// ====================== DELETE ARTICLE ======================


// const deleteArticle = async (req, res, next) => {
//   try {
//     // ✅ Use findOne with setOptions to bypass the pre-find isDeleted filter
//     const article = await Article.findByIdAndDelete(req.params.id)
//       // .setOptions({ includeDeleted: true });

//     if (!article) return sendNotFound(res, "Article not found.");

//     const isOwner = article.author.toString() === req.user._id.toString();
//     const isAdmin = ["super_admin", "admin"].includes(req.user.role);

//     if (req.user.role === "writer") {
//       if (!isOwner) {
//         return sendError(res, "You can only delete your own articles.", 403);
//       }
//     } else if (!isAdmin) {
//       return sendError(res, "Access denied.", 403);
//     }


//     // ✅ Cleanup images from ImageKit BEFORE marking deleted
//     if (article.featuredImage?.fileId) {
//       await deleteFromImageKit(article.featuredImage.fileId);
//     }
//     if (article.gallery?.length) {
//       for (const img of article.gallery) {
//         if (img?.fileId) await deleteFromImageKit(img.fileId);
//       }
//     }

//     await Article.findByIdAndDelete(req.params.id);

//     // ✅ Decrement user's article count
//     await User.findByIdAndUpdate(req.user._id, {
//       $inc: { "stats.totalArticles": -1 },
//     });

//     // ✅ Decrement tag usage counts
//     if (article.tags?.length) {
//       await Tag.updateMany(
//         { _id: { $in: article.tags } },
//         { $inc: { usageCount: -1 } }
//       );
//     }

//     log({
//       user: req.user._id,
//       action: "article_delete",
//       resource: article._id.toString(),
//       ip: req.ip,
//     });

//     return sendSuccess(res, {}, "Article deleted successfully.");
//   } catch (err) {
//     next(err);
//   }
// };

const deleteArticle = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return sendNotFound(res, "Article not found.");

    const isOwner = article.author.toString() === req.user._id.toString();
    const isAdmin = ["super_admin", "admin"].includes(req.user.role);

    if (req.user.role === "writer") {
      if (!isOwner) {
        return sendError(res, "You can only delete your own articles.", 403);
      }
    } else if (!isAdmin) {
      return sendError(res, "Access denied.", 403);
    }

    // Cleanup media
    if (article.featuredImage?.fileId) await deleteFromImageKit(article.featuredImage.fileId);
    if (article.gallery?.length) {
      for (const img of article.gallery) {
        if (img?.fileId) await deleteFromImageKit(img.fileId);
      }
    }

    await Article.findByIdAndDelete(req.params.id);

    await User.findByIdAndUpdate(article.author, {
      $inc: { "stats.totalArticles": -1 },
    });

    log({
      user: req.user._id,
      action: "article_delete",
      resource: article._id.toString(),
      meta: { isOwner },
      ip: req.ip,
    });

    return sendSuccess(res, {}, "Article deleted successfully.");
  } catch (err) {
    next(err);
  }
};


// ====================== LIKE ARTICLE ======================
const likeArticle = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return sendNotFound(res, "Article not found.");

    article.likes = (article.likes || 0) + 1;
    await article.save();

    return sendSuccess(res, { likes: article.likes }, "Article liked.");
  } catch (err) {
    next(err);
  }
};

// ====================== REACT TO ARTICLE ======================
const reactToArticle = async (req, res, next) => {
  try {
    const { reaction } = req.body;
    if (!reaction) return sendError(res, "Reaction is required", 400);

    const article = await Article.findById(req.params.id);
    if (!article) return sendNotFound(res, "Article not found.");

    if (!article.reactions) article.reactions = new Map();

    const current = article.reactions.get(reaction) || 0;
    article.reactions.set(reaction, current + 1);

    await article.save();

    return sendSuccess(res, {
      reactions: Object.fromEntries(article.reactions),
    });
  } catch (err) {
    next(err);
  }
};

// ====================== EXPORTS ======================
module.exports = {
  getMyArticleStats,
  getArticles,
  getArticle,
  getBreakingNews,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  reactToArticle,
  likeArticle,
};