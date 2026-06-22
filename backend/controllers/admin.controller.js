const { ActivityLog, log } = require("../models/ActivityLog");
const Article = require("../models/Article");
const Blog = require("../models/Blog");
const Comment = require("../models/Comment");
const Newsletter = require("../models/Newsletter");
const User = require("../models/User");
const env = require("../lib/env");
const logger = require("../utils/logger");
const { sendEmail, templates } = require("../utils/email");
const { stripHtml } = require("../utils/sanitise");
const { generateSecureToken, hashToken } = require("../utils/tokens");
const { getImageKitAuthParams } = require("../config/Imagekit");
const {
  sendSuccess, sendCreated, sendError,
  sendNotFound, sendForbidden,
} = require("../utils/apiResponse");

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** Roles a creator may assign to invited users */
const ROLE_HIERARCHY = {
  super_admin: ["admin", "writer", "user"],
  admin: ["writer"],
};

/** Valid management scopes for the manager role */
const MANAGER_SCOPES = [
  "content_manager",
  "community_manager",
  "operations_manager",
  "editorial_manager",
];

const MANAGER_SCOPE_LABEL = {
  content_manager: "Content Manager",
  community_manager: "Community Manager",
  operations_manager: "Operations Manager",
  editorial_manager: "Editorial Manager",
};

/** Fields safe to return to clients for a user/manager document */
const PUBLIC_USER_FIELDS = [
  "_id", "name", "email", "role", "partnerCompany",
  "inviteManagement", "isVerified", "isActive", "createdAt",
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function allowedRolesFor(creatorRole) {
  return ROLE_HIERARCHY[creatorRole] ?? [];
}

function canAssign(creatorRole, targetRole) {
  return allowedRolesFor(creatorRole).includes(targetRole);
}

/** Whitelist a Mongoose user doc down to public-safe fields only */
function toPublicUser(userDoc) {
  const obj = userDoc.toObject ? userDoc.toObject() : userDoc;
  const result = {};
  for (const field of PUBLIC_USER_FIELDS) {
    if (obj[field] !== undefined) result[field] = obj[field];
  }
  return result;
}

/** Escape a string for safe interpolation into HTML email bodies */
function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

/** Escape regex special characters and cap length before use in $regex filters */
function buildSafeRegexFilter(rawSearch, maxLen = 100) {
  const trimmed = String(rawSearch ?? "").trim().slice(0, maxLen);
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { $regex: escaped, $options: "i" };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/admin/invite
//
// super_admin → invites admin  (partnerCompany REQUIRED in body)
// admin       → invites writer (partnerCompany INHERITED from admin)
// ─────────────────────────────────────────────────────────────────────────────
exports.inviteUser = async (req, res, next) => {
  try {
    const { email, role, name, partnerCompany } = req.body;
    const creator = req.user;

    // ── Hierarchy check ───────────────────────────────────────────────────────
    if (!canAssign(creator.role, role)) {
      return sendForbidden(res, `A ${creator.role} cannot invite a ${role}.`);
    }

    // ── Resolve partnerCompany ────────────────────────────────────────────────
    let resolvedCompany = null;

    if (creator.role === "super_admin") {
      if (!partnerCompany || partnerCompany.trim().length < 2) {
        return sendError(res, "partnerCompany is required when inviting an admin.", 400);
      }
      resolvedCompany = stripHtml(partnerCompany.trim());
    } else if (creator.role === "admin") {
      if (!creator.partnerCompany) {
        return sendError(
          res,
          "Your account has no partnerCompany set. Contact a super admin.",
          500
        );
      }
      resolvedCompany = creator.partnerCompany;
    }

    // ── Duplicate email check ─────────────────────────────────────────────────
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail }).lean()) {
      return sendError(res, "Email already registered.", 409);
    }

    // ── Create pending user ───────────────────────────────────────────────────
    const token = generateSecureToken();
    const hashed = hashToken(token);

    const user = await User.create({
      name: name?.trim() || normalizedEmail.split("@")[0],
      email: normalizedEmail,
      password: `__invite__${token}`,
      role,
      partnerCompany: resolvedCompany,
      createdBy: creator._id,
      isVerified: false,
      isActive: false,
      inviteToken: hashed,
      inviteExpires: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 h
    });

    // ── Send invite email — never let an email failure undo the created user ──
    const inviteUrl = `${env.ADMIN_URL}/accept-invite?token=${token}`;
    const { subject, html } = templates.adminInvite(creator.name, role, inviteUrl);
    try {
      await sendEmail({ to: normalizedEmail, subject, html });
    } catch (err) {
      logger.error(`Invite email failed for ${normalizedEmail}:`, err);
    }

    log({
      user: creator._id,
      action: "user_invite",
      resource: user._id.toString(),
      meta: { role, email: normalizedEmail, partnerCompany: resolvedCompany },
      ip: req.ip,
    });

    return sendCreated(
      res,
      { user: toPublicUser(user), partnerCompany: resolvedCompany },
      `Invite sent to ${normalizedEmail} as ${role}.`
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/admin/invite_management
//
// super_admin ONLY — invites a manager to oversee the platform
// role is always "manager"; inviteManagement defines the scope
// Body: { name, email, inviteManagement }
//
// NOTE: name/email/inviteManagement format & presence are enforced by
// inviteManagementSchema via the validate() middleware on the route —
// duplicate manual checks were removed here to avoid logic drift.
// ─────────────────────────────────────────────────────────────────────────────
exports.inviteManagement = async (req, res, next) => {
  try {
    const { name, email, inviteManagement } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    // ── Duplicate email check ─────────────────────────────────────────────────
    if (await User.findOne({ email: normalizedEmail }).lean()) {
      return sendError(res, "A user with this email already exists.", 409);
    }

    // ── Generate invite token ─────────────────────────────────────────────────
    const token = generateSecureToken();
    const hashed = hashToken(token);

    // ── Create manager user ───────────────────────────────────────────────────
    const manager = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      password: `__invite__${token}`,
      role: "manager",
      inviteManagement,
      createdBy: req.user._id,
      isVerified: false,
      isActive: false,
      inviteToken: hashed,
      inviteExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // ── Send invite email — never let an email failure undo the created user ──
    const inviteUrl = `${env.ADMIN_URL}/accept-invite?token=${token}`;
    const safeName = escapeHtml(trimmedName);
    const safeScopeLabel = escapeHtml(MANAGER_SCOPE_LABEL[inviteManagement]);

    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "You've been invited as a Manager",
        html: `
          <p>Hi ${safeName},</p>
          <p>You have been invited to join as a
             <strong>${safeScopeLabel}</strong>.</p>
          <p>Click below to accept your invitation and set your password:</p>
          <a href="${inviteUrl}">${inviteUrl}</a>
          <p>This link expires in 7 days.</p>
        `,
      });
    } catch (err) {
      logger.error(`Manager invite email failed for ${normalizedEmail}:`, err);
    }

    // ── Activity log ──────────────────────────────────────────────────────────
    log({
      user: req.user._id,
      action: "user_invite",
      resource: manager._id.toString(),
      meta: { role: "manager", email: normalizedEmail, inviteManagement },
      ip: req.ip,
    });

    return sendCreated(
      res,
      { user: toPublicUser(manager) },
      `Manager invitation sent to ${normalizedEmail}.`
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/admin/users
//
// super_admin → all users, filterable by role
// admin       → only writers they personally created
// ─────────────────────────────────────────────────────────────────────────────
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search, isBanned } = req.query;
    const filter = {};

    if (req.user.role === "admin") {
      filter.createdBy = req.user._id;
      filter.role = "writer";
    } else {
      if (role) filter.role = role;
    }

    if (isBanned !== undefined) filter.isBanned = isBanned === "true";

    if (search) {
      const regex = buildSafeRegexFilter(search);
      filter.$or = [{ name: regex }, { email: regex }];
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
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/admin/users/:id/role   — super_admin only
// ─────────────────────────────────────────────────────────────────────────────
exports.changeRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!canAssign(req.user.role, role)) {
      return sendError(
        res,
        `Invalid role or insufficient permission to assign '${role}'.`,
        400
      );
    }

    if (req.user._id.toString() === req.params.id) {
      return sendForbidden(res, "You cannot change your own role.");
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );
    if (!user) return sendNotFound(res, "User not found.");

    log({
      user: req.user._id,
      action: "user_role_change",
      resource: user._id.toString(),
      meta: { role },
      ip: req.ip,
    });

    return sendSuccess(res, { user: toPublicUser(user) }, "Role updated.");
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/admin/users/:id/ban
// ─────────────────────────────────────────────────────────────────────────────
exports.banUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return sendError(res, "Ban reason is required.", 400);

    if (req.user._id.toString() === req.params.id) {
      return sendForbidden(res, "You cannot ban yourself.");
    }

    const target = await User.findById(req.params.id);
    if (!target) return sendNotFound(res, "User not found.");

    if (target.role === "super_admin") {
      return sendForbidden(res, "You cannot ban a super admin.");
    }

    if (req.user.role === "admin") {
      const isOwned = target.createdBy?.toString() === req.user._id.toString();
      if (!isOwned) return sendForbidden(res, "You can only ban writers you created.");
    }

    target.isBanned = true;
    target.banReason = stripHtml(reason).slice(0, 300);
    await target.save();

    log({
      user: req.user._id,
      action: "user_ban",
      resource: target._id.toString(),
      meta: { reason: target.banReason },
      severity: "warning",
      ip: req.ip,
    });

    return sendSuccess(res, { user: toPublicUser(target) }, "User banned.");
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/admin/users/:id/unban
// ─────────────────────────────────────────────────────────────────────────────
exports.unbanUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: false, banReason: "" },
      { new: true }
    );
    if (!user) return sendNotFound(res, "User not found.");

    log({
      user: req.user._id,
      action: "user_unban",
      resource: req.params.id,
      ip: req.ip,
    });

    return sendSuccess(res, { user: toPublicUser(user) }, "User unbanned.");
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/admin/users/:id/activity
// ─────────────────────────────────────────────────────────────────────────────
exports.getUserActivity = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find({ user: req.params.id })
      .sort("-createdAt")
      .limit(100)
      .lean();

    return sendSuccess(res, { logs });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/admin/comments
// admin / super_admin — all comments, admin scoped to their writers' articles
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllComments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      type,
    } = req.query;

    const filter = { isDeleted: false };

    if (status) filter.status = status;
    if (type === "article") filter.article = { $exists: true, $ne: null };
    if (type === "blog") filter.blog = { $exists: true, $ne: null };
    if (search) filter.body = buildSafeRegexFilter(search);

    if (req.user.role === "admin") {
      const writers = await User.find({ createdBy: req.user._id, role: "writer" })
        .select("_id")
        .lean();
      const articles = await Article.find({
        author: { $in: writers.map((w) => w._id) },
      })
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
        .populate("author", "name email avatar role")
        .populate("article", "title slug")
        .populate("blog", "title slug")
        .lean(),
      Comment.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      comments,
      pagination: {
        page: +page,
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
// GET /api/v1/admin/imagekit-auth
// ─────────────────────────────────────────────────────────────────────────────
exports.getImageKitAuth = (req, res, next) => {
  try {
    const params = getImageKitAuthParams();
    return sendSuccess(res, { auth: params });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/admin/overview
//
// writer     → own article stats
// admin      → their team's stats
// super_admin → full platform overview
// ─────────────────────────────────────────────────────────────────────────────
exports.getOverview = async (req, res, next) => {
  try {
    const { role, _id } = req.user;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // ── Writer ────────────────────────────────────────────────────────────────
    if (role === "writer") {
      const [totalArticles, published, draft, viewsAgg] = await Promise.all([
        Article.countDocuments({ author: _id, isDeleted: false }),
        Article.countDocuments({ author: _id, isDeleted: false, status: "published" }),
        Article.countDocuments({ author: _id, isDeleted: false, status: "draft" }),
        Article.aggregate([
          { $match: { author: _id, isDeleted: false } },
          { $group: { _id: null, v: { $sum: "$views" } } },
        ]),
      ]);

      return sendSuccess(res, {
        scope: "writer",
        articles: { total: totalArticles, published, draft },
        totalViews: viewsAgg[0]?.v ?? 0,
      });
    }

    // ── Admin ─────────────────────────────────────────────────────────────────
    if (role === "admin") {
      const myWriters = await User.find({ createdBy: _id, role: "writer" })
        .select("_id")
        .lean();
      const writerIds = myWriters.map((w) => w._id);

      const [totalArticles, published, viewsAgg, totalWriters] = await Promise.all([
        Article.countDocuments({ author: { $in: writerIds }, isDeleted: false }),
        Article.countDocuments({ author: { $in: writerIds }, isDeleted: false, status: "published" }),
        Article.aggregate([
          { $match: { author: { $in: writerIds }, isDeleted: false } },
          { $group: { _id: null, v: { $sum: "$views" } } },
        ]),
        User.countDocuments({ createdBy: _id, role: "writer" }),
      ]);

      return sendSuccess(res, {
        scope: "admin",
        writers: totalWriters,
        articles: { total: totalArticles, published },
        totalViews: viewsAgg[0]?.v ?? 0,
      });
    }

    // ── Super Admin ───────────────────────────────────────────────────────────
    const [
      totalArticles, publishedArticles,
      totalBlogs, pendingBlogs,
      totalUsers, newUsersThisMonth,
      totalComments, pendingComments,
      totalSubscribers, suspiciousActivity,
      viewsAgg,
    ] = await Promise.all([
      Article.countDocuments({ isDeleted: false }),
      Article.countDocuments({ status: "published", isDeleted: false }),
      Blog.countDocuments({ isDeleted: false }),
      Blog.countDocuments({ status: "pending", isDeleted: false }),
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Comment.countDocuments({ isDeleted: false }),
      Comment.countDocuments({ status: "pending", isDeleted: false }),
      Newsletter.countDocuments({ isActive: true }),
      ActivityLog.countDocuments({
        isSuspicious: true,
        createdAt: { $gte: thirtyDaysAgo },
      }),
      Article.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, v: { $sum: "$views" } } },
      ]),
    ]);

    return sendSuccess(res, {
      scope: "super_admin",
      articles: { total: totalArticles, published: publishedArticles },
      blogs: { total: totalBlogs, pending: pendingBlogs },
      users: { total: totalUsers, newThisMonth: newUsersThisMonth },
      comments: { total: totalComments, pending: pendingComments },
      newsletter: { subscribers: totalSubscribers },
      security: { suspiciousLast30Days: suspiciousActivity },
      totalViews: viewsAgg[0]?.v ?? 0,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/admin/top-articles
// ─────────────────────────────────────────────────────────────────────────────
exports.getTopArticles = async (req, res, next) => {
  try {
    const { role, _id } = req.user;
    const match = { status: "published", isDeleted: false };

    if (role === "writer") {
      match.author = _id;
    } else if (role === "admin") {
      const writers = await User.find({ createdBy: _id, role: "writer" })
        .select("_id")
        .lean();
      match.author = { $in: writers.map((w) => w._id) };
    }

    const articles = await Article.find(match)
      .sort("-views")
      .limit(10)
      .select("title slug views likes reactions publishedAt")
      .populate("category", "name slug")
      .lean();

    return sendSuccess(res, { articles });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/admin/articles-by-day
// Query param: ?days=30  (default 30)
// ─────────────────────────────────────────────────────────────────────────────
exports.getArticlesByDay = async (req, res, next) => {
  try {
    const { role, _id } = req.user;
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365); // clamp 1–365
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const match = {
      publishedAt: { $gte: since },
      status: "published",
      isDeleted: false,
    };
    if (role === "writer") match.author = _id;

    const data = await Article.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$publishedAt" } },
          count: { $sum: 1 },
          views: { $sum: "$views" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/admin/activity-logs  — super_admin only
// GET /api/v1/admin/activity       — admin / super_admin
// Query params: ?page=1&limit=50&isSuspicious=true&action=login&severity=warning
// ─────────────────────────────────────────────────────────────────────────────
exports.getActivityLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, isSuspicious, action, severity } = req.query;
    const filter = {};

    if (isSuspicious !== undefined) filter.isSuspicious = isSuspicious === "true";
    if (action) filter.action = action;
    if (severity) filter.severity = severity;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort("-createdAt")
        .skip(skip)
        .limit(parseInt(limit))
        .populate("user", "name email role")
        .lean(),
      ActivityLog.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      logs,
      pagination: {
        page: +page,
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
// POST /api/v1/admin/activity-logs  — admin / super_admin
//
// SECURITY: `user`, `severity`, and `isSuspicious` are intentionally NOT
// read from req.body — accepting them from the client would let any admin
// forge or downgrade audit trail entries. They are always derived
// server-side.
// ─────────────────────────────────────────────────────────────────────────────
exports.createActivityLog = async (req, res, next) => {
  try {
    const { action, resource, resourceType, meta } = req.body;

    if (!action) return sendError(res, "Action is required.", 400);

    const entry = await ActivityLog.create({
      user: req.user._id,
      action,
      resource,
      resourceType,
      meta,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    return sendCreated(res, { id: entry._id }, "Activity logged.");
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/admin/users-by-role  — super_admin only
// ─────────────────────────────────────────────────────────────────────────────
exports.getUsersByRole = async (req, res, next) => {
  try {
    const data = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};