const Notification = require("../models/Notification");
const { notifyFollowers, broadcastPush } = require("./webpush");

const notifyFollowersNewArticle = async (article, author) => {
  try {
    const Follow = require("../models/Follow");
    const follows = await Follow.find({ following: author._id }).select("follower").lean();
    const ids = follows.map((f) => f.follower);
    if (!ids.length) return;

    await Notification.insertMany(
      ids.map((uid) => ({
        recipient: uid, sender: author._id, type: "new_article",
        title: `${author.name} published a new article`,
        body: article.title, link: `/articles/${article.slug}`,
        article: article._id,
      })),
      { ordered: false }
    );

    await notifyFollowers(ids, {
      title: `📰 ${author.name}`,
      body: article.title,
      icon: article.featuredImage?.url || "/icon-192.png",
      url: `/articles/${article.slug}`,
    });
  } catch (err) {
    console.error("notifyFollowersNewArticle:", err.message);
  }
};

const notifyFollowersNewBlog = async (blog, author) => {
  try {
    const Follow = require("../models/Follow");
    const follows = await Follow.find({ following: author._id }).select("follower").lean();
    const ids = follows.map((f) => f.follower);
    if (!ids.length) return;

    await Notification.insertMany(
      ids.map((uid) => ({
        recipient: uid, sender: author._id, type: "new_blog",
        title: `${author.name} published a new post`,
        body: blog.title, link: `/blogs/${blog.slug}`,
        blog: blog._id,
      })),
      { ordered: false }
    );

    await notifyFollowers(ids, {
      title: `${author.name} posted`,
      body: blog.title,
      icon: blog.featuredImage?.url || "/icon-192.png",
      url: `/blogs/${blog.slug}`,
    });
  } catch (err) {
    console.error("notifyFollowersNewBlog:", err.message);
  }
};

const notifyArticleAuthorComment = async (article, comment, commenter) => {
  try {
    if (article.author.toString() === commenter._id.toString()) return;
    await Notification.create({
      recipient: article.author, sender: commenter._id, type: "new_comment",
      title: `${commenter.name} commented on your article`,
      body: comment.body.slice(0, 100),
      link: `/articles/${article.slug}#comments`,
      article: article._id, comment: comment._id,
    });
  } catch (err) { console.error("notifyAuthorComment:", err.message); }
};

const notifyCommentReply = async (parentComment, reply, replier) => {
  try {
    if (parentComment.author.toString() === replier._id.toString()) return;
    await Notification.create({
      recipient: parentComment.author, sender: replier._id, type: "comment_reply",
      title: `${replier.name} replied to your comment`,
      body: reply.body.slice(0, 100), comment: reply._id,
    });
  } catch (err) { console.error("notifyCommentReply:", err.message); }
};

const notifyNewFollower = async (followedUserId, follower) => {
  try {
    await Notification.create({
      recipient: followedUserId, sender: follower._id, type: "new_follower",
      title: `${follower.name} started following you`,
      link: `/profile/user/${follower._id}`,
    });
  } catch (err) { console.error("notifyNewFollower:", err.message); }
};

const broadcastBreakingNews = async (article) => {
  try {
    await broadcastPush({
      title: `🔴 BREAKING: ${article.title}`,
      body: article.excerpt || "Read the latest breaking news on NewsOrbit",
      icon: article.featuredImage?.url || "/icon-192.png",
      url: `/articles/${article.slug}`,
    });
  } catch (err) { console.error("broadcastBreaking:", err.message); }
};

module.exports = {
  notifyFollowersNewArticle,
  notifyFollowersNewBlog,
  notifyArticleAuthorComment,
  notifyCommentReply,
  notifyNewFollower,
  broadcastBreakingNews,
};
