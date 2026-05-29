
const { ActivityLog, log } = require("../models/ActivityLog");
const Article = require("../models/Article");
const Blog = require("../models/Blog");
const Comment = require("../models/Comment");
const Newsletter = require("../models/Newsletter");
const User = require("../models/User");
const { sendEmail, templates }  = require("../utils/email");
const { stripHtml } = require("../utils/sanitise");
const { generateSecureToken, hashToken } = require("../utils/tokens");
const { getImageKitAuthParams } = require("../config/Imagekit");
const {
  sendSuccess, sendCreated, sendError,
  sendNotFound, sendForbidden,
} = require("../utils/apiResponse");

// ─────────────────────────────────────────────────────────────────────────────
// ROLE HIERARCHY — single source of truth
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_HIERARCHY = {
  super_admin: ["admin", "writer", "user"],
  admin:       ["writer"],
  // writer / user → no creation rights (omitted intentionally)
};

/**
 * Returns the list of roles a given creator may assign.
 * @param {string} creatorRole
 * @returns {string[]}
 */
function allowedRolesFor(creatorRole) {
  return ROLE_HIERARCHY[creatorRole] ?? [];
}

/**
 * Returns true when `creatorRole` can assign `targetRole`.
 * @param {string} creatorRole
 * @param {string} targetRole
 */
function canAssign(creatorRole, targetRole) {
  return allowedRolesFor(creatorRole).includes(targetRole);
}



// GET /api/v1/admin/comments
// admin / super_admin — fetch all comments across all resources
exports.getAllComments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      type,        // "article" | "blog"
      isSuspicious,
    } = req.query;

    const filter = { isDeleted: false };

    if (status)             filter.status  = status;
    if (type === "article") filter.article = { $exists: true, $ne: null };
    if (type === "blog")    filter.blog    = { $exists: true, $ne: null };
    if (search)             filter.body    = { $regex: search, $options: "i" };

    // admin scoped to articles written by their writers
    if (req.user.role === "admin") {
      const writers = await User.find({ createdBy: req.user._id, role: "writer" })
        .select("_id")
        .lean();
      const writerIds = writers.map((w) => w._id);
      const articles  = await Article.find({ author: { $in: writerIds } })
        .select("_id")
        .lean();
      filter.article = { $in: articles.map((a) => a._id) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [comments, total] = await Promise.all([
      Comment.find(filter)
        .sort("-createdAt")
        .skip(skip)
        .limit(parseInt(limit))
        .populate("author",  "name email avatar role")
        .populate("article", "title slug")
        .populate("blog",    "title slug")
        .lean(),
      Comment.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      comments,
      pagination: {
        page:  +page,
        limit: +limit,
        total,
        pages: Math.ceil(total / +limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/admin/invite
// super_admin → invites admin | admin → invites writer
// ─────────────────────────────────────────────────────────────────────────────
exports.inviteUser = async (req, res, next) => {
  try {
    const { email, role, name } = req.body;
    const creatorRole = req.user.role;

    // ── Guard: hierarchy check ────────────────────────────────────────────────
    if (!canAssign(creatorRole, role)) {
      return sendForbidden(res, `A ${creatorRole} cannot invite a ${role}.`);
    }

    // ── Guard: no duplicate emails ────────────────────────────────────────────
    if (await User.findOne({ email })) {
      return sendError(res, "Email already registered.", 409);
    }

    // ── Create pending user ───────────────────────────────────────────────────
    const token  = generateSecureToken();
    const hashed = hashToken(token);

    const user = await User.create({
      name: name || email.split("@")[0],
      email,
      password: token,        // temporary — overwritten when invite is accepted
      role,
      createdBy: req.user._id,
      isVerified: false,
      inviteToken: hashed,
      inviteExpires: Date.now() + 48 * 60 * 60 * 1000,  // 48 h
    });

    // ── Send invite email (fire-and-forget) ───────────────────────────────────
    const inviteUrl = `${process.env.ADMIN_URL}/accept-invite?token=${token}`;
    const { subject, html } = templates.adminInvite(req.user.name, role, inviteUrl);
    await sendEmail({ to: email, subject, html }).catch(() => {});

    log({
      user: req.user._id,
      action: "user_invite",
      resource: user._id.toString(),
      meta: { role, email },
      ip: req.ip,
    });

    return sendCreated(res, { userId: user._id }, `Invite sent to ${email} as ${role}.`);
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/admin/users
// super_admin → sees all users (filterable by role)
// admin       → sees only writers they personally created
// ─────────────────────────────────────────────────────────────────────────────
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search, isBanned } = req.query;
    const filter = {};

    if (req.user.role === "admin") {
      // Admins are scoped to their own writers
      filter.createdBy = req.user._id;
      filter.role = "writer";
    } else {
      // super_admin: optional role filter from query
      if (role) filter.role = role;
    }

    if (isBanned !== undefined) filter.isBanned = isBanned === "true";
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort("-createdAt")
        .skip(skip)
        .limit(parseInt(limit))
        .populate("createdBy", "name role"),
      User.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      users,
      pagination: { page: +page, limit: +limit, total },
    });
  } catch (err) { next(err); }
};


// PATCH /api/v1/admin/users/:id/role   — super_admin only

exports.changeRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    // Guard: role must be one that the caller can assign
    if (!canAssign(req.user.role, role)) {
      return sendError(res, `Invalid role or insufficient permission to assign '${role}'.`, 400);
    }

    // Guard: cannot change your own role
    if (req.user._id.toString() === req.params.id) {
      return sendForbidden(res, "You cannot change your own role.");
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return sendNotFound(res, "User not found.");

    log({
      user: req.user._id,
      action: "user_role_change",
      resource: user._id.toString(),
      meta: { role },
      ip: req.ip,
    });

    return sendSuccess(res, { user }, "Role updated.");
  } catch (err) { next(err); }
};


// PATCH /api/v1/admin/users/:id/ban

exports.banUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return sendError(res, "Ban reason is required.", 400);

    // Guard: cannot ban yourself
    if (req.user._id.toString() === req.params.id) {
      return sendForbidden(res, "You cannot ban yourself.");
    }

    const target = await User.findById(req.params.id);
    if (!target) return sendNotFound(res, "User not found.");

    // Guard: cannot ban a super_admin
    if (target.role === "super_admin") {
      return sendForbidden(res, "You cannot ban a super admin.");
    }

    // Guard: admin can only ban writers they created
    if (req.user.role === "admin") {
      const isOwned = target.createdBy?.toString() === req.user._id.toString();
      if (!isOwned) return sendForbidden(res, "You can only ban writers you created.");
    }

    target.isBanned  = true;
    target.banReason = stripHtml(reason).slice(0, 300);
    await target.save();

    log({
      user:     req.user._id,
      action:   "user_ban",
      resource: target._id.toString(),
      meta:     { reason },
      severity: "warning",
      ip:       req.ip,
    });

    return sendSuccess(res, { user: target }, "User banned.");
  } catch (err) { next(err); }
};


// PATCH /api/v1/admin/users/:id/unban

exports.unbanUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: false, banReason: "" },
      { new: true }
    );
    if (!user) return sendNotFound(res, "User not found.");

    log({ user: req.user._id, action: "user_unban", resource: req.params.id, ip: req.ip });

    return sendSuccess(res, { user }, "User unbanned.");
  } catch (err) { next(err); }
};


// GET /api/v1/admin/users/:id/activity
// ─────────────────────────────────────────────────────────────────────────────
exports.getUserActivity = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find({ user: req.params.id })
      .sort("-createdAt")
      .limit(100)
      .lean();

    return sendSuccess(res, { logs });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/admin/imagekit-auth
// Returns short-lived credentials so the browser can upload directly to ImageKit
// (useful for rich-text editors, article galleries, etc.)
// ─────────────────────────────────────────────────────────────────────────────
exports.getImageKitAuth = (req, res, next) => {
  try {
    const params = getImageKitAuthParams();
    return sendSuccess(res, { auth: params });
  } catch (err) { next(err); }
};

// ═════════════════════════════════════════════════════════════════════════════
// ANALYTICS
// Scoped by role — every handler reads req.user.role to decide what to return.
//   super_admin → full platform data
//   admin       → their team (writers they created)
//   writer      → only their own articles
// ═════════════════════════════════════════════════════════════════════════════

// ── GET /api/v1/admin/analytics/overview ─────────────────────────────────────
exports.getOverview = async (req, res, next) => {
  try {
    const { role, _id } = req.user;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // ── Writer: own article stats only ────────────────────────────────────────
    if (role === "writer") {
      const [totalArticles, published, draft, views] = await Promise.all([
        Article.countDocuments({ author: _id, isDeleted: false }),
        Article.countDocuments({ author: _id, isDeleted: false, status: "published" }),
        Article.countDocuments({ author: _id, isDeleted: false, status: "draft" }),
        Article.aggregate([
          { $match: { author: _id, isDeleted: false } },
          { $group: { _id: null, v: { $sum: "$views" } } },
        ]),
      ]);
      return sendSuccess(res, {
        scope:      "writer",
        articles:   { total: totalArticles, published, draft },
        totalViews: views[0]?.v || 0,
      });
    }

    // ── Admin: stats for writers they created ─────────────────────────────────
    if (role === "admin") {
      const myWriters = await User.find({ createdBy: _id, role: "writer" }).select("_id").lean();
      const writerIds = myWriters.map(w => w._id);

      const [totalArticles, published, totalViews, totalWriters] = await Promise.all([
        Article.countDocuments({ author: { $in: writerIds }, isDeleted: false }),
        Article.countDocuments({ author: { $in: writerIds }, isDeleted: false, status: "published" }),
        Article.aggregate([
          { $match: { author: { $in: writerIds }, isDeleted: false } },
          { $group: { _id: null, v: { $sum: "$views" } } },
        ]),
        User.countDocuments({ createdBy: _id, role: "writer" }),
      ]);

      return sendSuccess(res, {
        scope:      "admin",
        writers:    totalWriters,
        articles:   { total: totalArticles, published },
        totalViews: totalViews[0]?.v || 0,
      });
    }

    // ── super_admin: full platform overview ───────────────────────────────────
    const [
      totalArticles, publishedArticles,
      totalBlogs,    pendingBlogs,
      totalUsers,    newUsersThisMonth,
      totalComments, pendingComments,
      totalSubscribers, suspiciousActivity,
    ] = await Promise.all([
      Article.countDocuments({ isDeleted: false }),
      Article.countDocuments({ status: "published", isDeleted: false }),
      Blog.countDocuments({ isDeleted: false }),
      Blog.countDocuments({ status: "pending",  isDeleted: false }),
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Comment.countDocuments({ isDeleted: false }),
      Comment.countDocuments({ status: "pending", isDeleted: false }),
      Newsletter.countDocuments({ isActive: true }),
      ActivityLog.countDocuments({ isSuspicious: true, createdAt: { $gte: thirtyDaysAgo } }),
    ]);

    const viewsAgg = await Article.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, v: { $sum: "$views" } } },
    ]);

    return sendSuccess(res, {
      scope:      "super_admin",
      articles:   { total: totalArticles,  published: publishedArticles },
      blogs:      { total: totalBlogs,     pending:   pendingBlogs },
      users:      { total: totalUsers,     newThisMonth: newUsersThisMonth },
      comments:   { total: totalComments,  pending:   pendingComments },
      newsletter: { subscribers: totalSubscribers },
      security:   { suspiciousLast30Days: suspiciousActivity },
      totalViews: viewsAgg[0]?.v || 0,
    });
  } catch (err) { next(err); }
};

// ── GET /api/v1/admin/analytics/top-articles ─────────────────────────────────
exports.getTopArticles = async (req, res, next) => {
  try {
    const { role, _id } = req.user;
    const match = { status: "published", isDeleted: false };

    if (role === "writer") {
      match.author = _id;
    } else if (role === "admin") {
      const writers = await User.find({ createdBy: _id, role: "writer" }).select("_id").lean();
      match.author  = { $in: writers.map(w => w._id) };
    }
    // super_admin: no author filter → all articles

    const articles = await Article.find(match)
      .sort("-views")
      .limit(10)
      .select("title slug views likes reactions publishedAt")
      .populate("category", "name slug")
      .lean();

    return sendSuccess(res, { articles });
  } catch (err) { next(err); }
};

// ── GET /api/v1/admin/analytics/articles-by-day ──────────────────────────────
// Query param: ?days=30  (default 30)
exports.getArticlesByDay = async (req, res, next) => {
  try {
    const { role, _id } = req.user;
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const match = { publishedAt: { $gte: since }, status: "published", isDeleted: false };
    if (role === "writer") match.author = _id;
    // admin / super_admin: no author scope here (top-articles already covers team drill-down)

    const data = await Article.aggregate([
      { $match: match },
      {
        $group: {
          _id:   { $dateToString: { format: "%Y-%m-%d", date: "$publishedAt" } },
          count: { $sum: 1 },
          views: { $sum: "$views" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return sendSuccess(res, { data });
  } catch (err) { next(err); }
};

// ── GET /api/v1/admin/analytics/activity-logs  — super_admin only ─────────────
// Query params: ?page=1&limit=50&isSuspicious=true&action=login&severity=warning
exports.getActivityLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, isSuspicious, action, severity } = req.query;
    const filter = {};

    if (isSuspicious !== undefined) filter.isSuspicious = isSuspicious === "true";
    if (action)   filter.action   = action;
    if (severity) filter.severity = severity;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort("-createdAt")
        .skip(skip)
        .limit(parseInt(limit))
        .populate("user", "name email role"),
      ActivityLog.countDocuments(filter),
    ]);

    return sendSuccess(res, { logs, total });
  } catch (err) { next(err); }
};

// ── GET /api/v1/admin/analytics/users-by-role  — super_admin only ────────────
exports.getUsersByRole = async (req, res, next) => {
  try {
    const data = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
    ]);
    return sendSuccess(res, { data });
  } catch (err) { next(err); }
};



// Activitylog
// Create an activity log entry (admin / super_admin)
exports.createActivityLog = async (req, res, next) => {
  try {
    const { user, action, resource, resourceType, meta, severity, isSuspicious } = req.body;

    if (!action) return sendError(res, "Action is required.", 400);

    const entry = await ActivityLog.create({
      user: user || req.user?._id,
      action,
      resource,
      resourceType,
      meta,
      severity,
      isSuspicious,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    return sendCreated(res, { id: entry._id }, "Activity logged.");
  } catch (err) { next(err); }
};
