const Comment = require("../models/Comment");
const Article = require("../models/Article");
const Blog    = require("../models/Blog");

const { stripHtml } = require("../utils/sanitise");
const { log }       = require("../models/ActivityLog");
const { notifyArticleAuthorComment, notifyCommentReply } = require("../utils/notification");
const {
  sendSuccess, sendCreated, sendError, sendNotFound, sendForbidden,
} = require("../utils/apiResponse");

const MAX_REPLY_DEPTH = 5;

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Resolve the parent resource (Article or Blog) from route params. */
const getParent = async (req) => {
  if (req.params.articleId) {
    const a = await Article.findById(req.params.articleId)
      .select("allowComments author slug");
    return { parent: a, type: "article" };
  }
  if (req.params.blogId) {
    const b = await Blog.findById(req.params.blogId)
      .select("allowComments author slug");
    return { parent: b, type: "blog" };
  }
  return { parent: null, type: null };
};

/**
 * Walk up the parent chain and return the depth (1 = direct child of root).
 * Returns Infinity if the chain is broken (orphaned comment), which will
 * trigger the depth-cap error and prevent the write.
 */
const getReplyDepth = async (parentComment) => {
  let depth  = 1;
  let cursor = parentComment;

  while (cursor.parent) {
    cursor = await Comment.findById(cursor.parent).select("parent").lean();
    if (!cursor) return Infinity;   // broken chain — block it
    depth++;
    if (depth >= MAX_REPLY_DEPTH) return depth;
  }

  return depth;
};

/**
 * Build a flat list of comments into a nested reply tree.
 * Handles unlimited depth in O(n) time.
 */
const buildTree = (flatComments) => {
  const map   = {};
  const roots = [];

  // First pass — index every comment
  flatComments.forEach((c) => {
    map[c._id.toString()] = { ...c, replies: [] };
  });

  // Second pass — attach to parent or mark as root
  flatComments.forEach((c) => {
    if (c.parent) {
      const parentNode = map[c.parent.toString()];
      if (parentNode) {
        parentNode.replies.push(map[c._id.toString()]);
        return;
      }
    }
    roots.push(map[c._id.toString()]);
  });

  return roots;
};

/**
 * Enrich comments with userLiked field for easier frontend handling.
 * Recursively processes nested replies.
 */
const enrichCommentsWithUserLiked = (comments, userId) => {
  return comments.map((comment) => ({
    ...comment,
    userLiked: userId ? comment.likedBy?.some(id => id.toString() === userId.toString()) : false,
    replies: comment.replies ? enrichCommentsWithUserLiked(comment.replies, userId) : [],
  }));
};

// ── Controllers ────────────────────────────────────────────────────────────────

// GET /api/v1/articles/:articleId/comments
// GET /api/v1/blogs/:blogId/comments
exports.getComments = async (req, res, next) => {
  try {
    const isAdmin = req.user && ["admin", "super_admin"].includes(req.user.role);

    // Build filter for every comment on this resource
    const filter = { isDeleted: false };
    if (req.params.articleId) filter.article = req.params.articleId;
    if (req.params.blogId) filter.blog     = req.params.blogId;

    if (!isAdmin) {
      if (req.user) {
        filter.$or = [
          { status: "approved" },
          { author: req.user._id },
        ];
      } else {
        filter.status = "approved";
      }
    }

    const { page = 1, limit = 30 } = req.query;

    // Fetch all comments for this resource in one query, oldest first so
    // parents always appear before their children when we build the tree.
    const allComments = await Comment.find(filter)
      .sort("createdAt")
      .populate("author", "name avatar role")
      .lean();

    // Build the full nested tree
    let roots = buildTree(allComments);

    // Enrich comments with userLiked field
    roots = enrichCommentsWithUserLiked(roots, req.user?._id);

    // Paginate at the root level only (replies travel with their parent)
    const total     = roots.length;
    const paginated = roots.slice((+page - 1) * +limit, +page * +limit);

    return sendSuccess(res, { comments: paginated, total, page: +page, limit: +limit });
  } catch (err) { next(err); }
};

// POST /api/v1/articles/:articleId/comments
// POST /api/v1/blogs/:blogId/comments
exports.createComment = async (req, res, next) => {
  try {
    const { body, parent } = req.body;
    const { parent: resource, type } = await getParent(req);

    if (!resource)               return sendNotFound(res, "Resource not found.");
    if (!resource.allowComments) return sendError(res, "Comments are disabled.", 403);

    // Validate parent comment and enforce depth cap
    let parentComment = null;
    if (parent) {
      parentComment = await Comment.findById(parent);
      if (!parentComment || parentComment.isDeleted)
        return sendError(res, "Parent comment not found.", 400);

      if (type === "article") {
        if (!parentComment.article || parentComment.article.toString() !== req.params.articleId)
          return sendError(res, "Parent comment does not belong to this article.", 400);
      } else if (type === "blog") {
        if (!parentComment.blog || parentComment.blog.toString() !== req.params.blogId)
          return sendError(res, "Parent comment does not belong to this post.", 400);
      }

      const depth = await getReplyDepth(parentComment);
      if (depth >= MAX_REPLY_DEPTH)
        return sendError(res, `Replies are limited to ${MAX_REPLY_DEPTH} levels deep.`, 400);
    }

    const safeBody = stripHtml(body || "").slice(0, 2000);
    if (!safeBody.length) return sendError(res, "Comment cannot be empty.", 400);

    const data = {
      author: req.user._id,
      body:   safeBody,
      parent: parent || null,
      status: "approved",
    };
    if (type === "article") data.article = req.params.articleId;
    if (type === "blog")    data.blog    = req.params.blogId;

    const comment   = await Comment.create(data);
    const populated = await comment.populate("author", "name avatar");

    log({
      user: req.user._id, action: "comment_create",
      resource: comment._id.toString(), resourceType: "Comment", ip: req.ip,
    });

    // Fire-and-forget notifications
    if (parent && parentComment) {
      notifyCommentReply(parentComment, comment, req.user).catch(() => {});
    } else if (type === "article") {
      notifyArticleAuthorComment(resource, comment, req.user).catch(() => {});
    }

    return sendCreated(res, { comment: populated }, "Comment posted.");
  } catch (err) { next(err); }
};

// PATCH /api/v1/comments/:id
exports.updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment || comment.isDeleted) return sendNotFound(res, "Comment not found.");
    if (comment.author.toString() !== req.user._id.toString())
      return sendForbidden(res, "Not allowed.");

    const safeBody = stripHtml(req.body.body || "").slice(0, 2000);
    if (!safeBody.length) return sendError(res, "Comment cannot be empty.", 400);

    comment.body     = safeBody;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    log({ user: req.user._id, action: "comment_edit", resource: comment._id.toString(), ip: req.ip });
    return sendSuccess(res, { comment }, "Comment updated.");
  } catch (err) { next(err); }
};

// DELETE /api/v1/comments/:id
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment || comment.isDeleted) return sendNotFound(res, "Comment not found.");

    const isOwner = comment.author.toString() === req.user._id.toString();
    const isAdmin = ["admin", "super_admin"].includes(req.user.role);
    if (!isOwner && !isAdmin) return sendForbidden(res, "Not allowed.");

    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await comment.save();

    log({ user: req.user._id, action: "comment_delete", resource: comment._id.toString(), ip: req.ip });
    return sendSuccess(res, {}, "Comment deleted.");
  } catch (err) { next(err); }
};

// POST /api/v1/comments/:id/like
exports.likeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment || comment.isDeleted) return sendNotFound(res, "Comment not found.");

    const userIdStr = req.user._id.toString();
    const liked = comment.likedBy.some(id => id.toString() === userIdStr);

    if (liked) {
      comment.likedBy = comment.likedBy.filter(id => id.toString() !== userIdStr);
      comment.likes = Math.max(0, comment.likes - 1);
    } else {
      comment.likedBy.push(req.user._id);
      comment.likes += 1;
    }

    await comment.save();
    return sendSuccess(res, { likes: comment.likes, userLiked: !liked });
  } catch (err) { next(err); }
};

// POST /api/v1/comments/:id/report
exports.reportComment = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const comment = await Comment.findById(req.params.id);
    if (!comment || comment.isDeleted) return sendNotFound(res, "Comment not found.");

    const already = comment.reports.some(
      (r) => r.reportedBy.toString() === req.user._id.toString(),
    );
    if (already) return sendError(res, "You have already reported this comment.", 400);

    comment.reports.push({ reportedBy: req.user._id, reason });
    await comment.save();

    log({
      user: req.user._id, action: "comment_report",
      resource: comment._id.toString(), severity: "warning",
      isSuspicious: true, meta: { reason }, ip: req.ip,
    });

    return sendSuccess(res, {}, "Comment reported.");
  } catch (err) { next(err); }
};