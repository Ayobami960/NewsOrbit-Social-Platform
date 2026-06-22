const Article = require("../models/Article");
const User = require("../models/User");
const Category = require("../models/Category");
const { sendSuccess } = require("../utils/apiResponse");

exports.getPublicStats = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [monthlyViews, publishedArticles, communityBloggers, newsCategories] = await Promise.all([
      Article.aggregate([
        { $match: { isDeleted: false, status: "published", publishedAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, views: { $sum: "$views" } } },
      ]),
      Article.countDocuments({ isDeleted: false, status: "published" }),
      User.countDocuments({ role: "writer" }),
      Category.countDocuments({ isActive: true }),
    ]);

    return sendSuccess(res, {
      stats: {
        monthlyReaders: monthlyViews[0]?.views ?? 0,
        articlesPublished: publishedArticles,
        communityBloggers,
        newsCategories,
      },
    });
  } catch (err) {
    next(err);
  }
};
