

const Article = require("../models/Article");
const Blog = require("../models/Blog");
const User = require("../models/User");
const Comment = require("../models/Comment");
const Newsletter = require("../models/Newsletter");
const { ActivityLog } = require("../models/ActivityLog");
const { sendSuccess } = require("../utils/apiResponse");

/**
 * Analytics are scoped by role:
 *  super_admin → full platform stats
 *  admin → their team's stats (writers they created)
 *  writer → only their own article stats
 */

// GET /api/v1/analytics/overview
exports.getOverview = async (req, res, next) => {
  try {
    const { role, _id } = req.user;
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    if (role === "writer") {
      // Writer sees only their own stats
      const [totalArticles, published, draft, views] = await Promise.all([
        Article.countDocuments({ author:_id, isDeleted:false }),
        Article.countDocuments({ author:_id, isDeleted:false, status:"published" }),
        Article.countDocuments({ author:_id, isDeleted:false, status:"draft" }),
        Article.aggregate([{ $match:{ author:_id, isDeleted:false } }, { $group:{ _id:null, v:{ $sum:"$views" } } }]),
      ]);
      return sendSuccess(res, { scope:"writer", articles:{ total:totalArticles, published, draft }, totalViews: views[0]?.v||0 });
    }

    if (role === "admin") {
      // Admin sees stats for writers they created
      const myWriters = await User.find({ createdBy:_id, role:"writer" }).select("_id").lean();
      const writerIds = myWriters.map(w=>w._id);
      const [totalArticles, published, totalViews, totalWriters] = await Promise.all([
        Article.countDocuments({ author:{ $in:writerIds }, isDeleted:false }),
        Article.countDocuments({ author:{ $in:writerIds }, isDeleted:false, status:"published" }),
        Article.aggregate([{ $match:{ author:{ $in:writerIds }, isDeleted:false } }, { $group:{ _id:null, v:{ $sum:"$views" } } }]),
        User.countDocuments({ createdBy:_id, role:"writer" }),
      ]);
      return sendSuccess(res, { scope:"admin", writers:totalWriters, articles:{ total:totalArticles, published }, totalViews: totalViews[0]?.v||0 });
    }

    // super_admin — full platform overview
    const [
      totalArticles, publishedArticles,
      totalBlogs, pendingBlogs,
      totalUsers, newUsersThisMonth,
      totalComments, pendingComments,
      totalSubscribers, suspiciousActivity,
    ] = await Promise.all([
      Article.countDocuments({ isDeleted:false }),
      Article.countDocuments({ status:"published", isDeleted:false }),
      Blog.countDocuments({ isDeleted:false }),
      Blog.countDocuments({ status:"pending", isDeleted:false }),
      User.countDocuments(),
      User.countDocuments({ createdAt:{ $gte:thirtyDaysAgo } }),
      Comment.countDocuments({ isDeleted:false }),
      Comment.countDocuments({ status:"pending", isDeleted:false }),
      Newsletter.countDocuments({ isActive:true }),
      ActivityLog.countDocuments({ isSuspicious:true, createdAt:{ $gte:thirtyDaysAgo } }),
    ]);

    const totalViews = await Article.aggregate([
      { $match:{ isDeleted:false } },
      { $group:{ _id:null, v:{ $sum:"$views" } } },
    ]);

    return sendSuccess(res, {
      scope: "super_admin",
      articles:    { total:totalArticles, published:publishedArticles },
      blogs:       { total:totalBlogs, pending:pendingBlogs },
      users:       { total:totalUsers, newThisMonth:newUsersThisMonth },
      comments:    { total:totalComments, pending:pendingComments },
      newsletter:  { subscribers:totalSubscribers },
      security:    { suspiciousLast30Days:suspiciousActivity },
      totalViews:  totalViews[0]?.v||0,
    });
  } catch (err) { next(err); }
};

// GET /api/v1/analytics/top-articles
exports.getTopArticles = async (req, res, next) => {
  try {
    const { role, _id } = req.user;
    const match = { status:"published", isDeleted:false };
    if (role === "writer") match.author = _id;
    else if (role === "admin") {
      const writers = await User.find({ createdBy:_id, role:"writer" }).select("_id").lean();
      match.author = { $in: writers.map(w=>w._id) };
    }
    const articles = await Article.find(match).sort("-views").limit(10)
      .select("title slug views likes reactions publishedAt")
      .populate("category","name slug").lean();
    return sendSuccess(res, { articles });
  } catch (err) { next(err); }
};

// GET /api/v1/analytics/articles-by-day
exports.getArticlesByDay = async (req, res, next) => {
  try {
    const { role, _id } = req.user;
    const { days=30 } = req.query;
    const since = new Date(Date.now() - parseInt(days)*24*60*60*1000);
    const match = { publishedAt:{ $gte:since }, status:"published", isDeleted:false };
    if (role === "writer") match.author = _id;

    const data = await Article.aggregate([
      { $match: match },
      { $group: { _id:{ $dateToString:{ format:"%Y-%m-%d", date:"$publishedAt" } }, count:{ $sum:1 }, views:{ $sum:"$views" } } },
      { $sort: { _id:1 } },
    ]);
    return sendSuccess(res, { data });
  } catch (err) { next(err); }
};

// GET /api/v1/analytics/activity — super_admin only
exports.getActivityLogs = async (req, res, next) => {
  try {
    const { page=1, limit=50, isSuspicious, action, severity } = req.query;
    const filter = {};
    if (isSuspicious !== undefined) filter.isSuspicious = isSuspicious === "true";
    if (action)   filter.action = action;
    if (severity) filter.severity = severity;

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter).sort("-createdAt")
        .skip((parseInt(page)-1)*parseInt(limit)).limit(parseInt(limit))
        .populate("user","name email role"),
      ActivityLog.countDocuments(filter),
    ]);
    return sendSuccess(res, { logs, total });
  } catch (err) { next(err); }
};

// GET /api/v1/analytics/users-by-role — super_admin only
exports.getUsersByRole = async (req, res, next) => {
  try {
    const data = await User.aggregate([
      { $group:{ _id:"$role", count:{ $sum:1 } } },
    ]);
    return sendSuccess(res, { data });
  } catch (err) { next(err); }
};