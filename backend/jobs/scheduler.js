const Article = require("../models/Article");
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const Newsletter = require("../models/Newsletter");
const logger = require("../utils/logger");

// ============================================================
// IN-PROCESS TIMER SYSTEM (for long-running / dev environments)
// ============================================================

const activeTimers = new Map();

const initQueues = () => {
  logger.info("Scheduler initialised (in-process, no Redis required).");
  rescheduleOnBoot();
};

const rescheduleOnBoot = async () => {
  try {
    const scheduled = await Article.find({
      status: "scheduled",
      scheduledAt: { $gt: new Date() },
    }).select("_id scheduledAt");

    for (const a of scheduled) {
      scheduleArticlePublish(a._id, a.scheduledAt);
    }

    logger.info(`Re-scheduled ${scheduled.length} pending articles.`);
  } catch (err) {
    logger.error(`Boot reschedule error: ${err.message}`);
  }
};

const scheduleArticlePublish = (articleId, publishAt) => {
  const delay = new Date(publishAt).getTime() - Date.now();
  if (delay < 0) return;

  if (activeTimers.has(articleId.toString())) {
    clearTimeout(activeTimers.get(articleId.toString()));
  }

  const timer = setTimeout(async () => {
    try {
      const article = await Article.findById(articleId);
      if (!article || article.status !== "scheduled") return;

      article.status = "published";
      article.publishedAt = new Date();
      await article.save();

      logger.info(`[Scheduler] Article ${articleId} auto-published.`);
      activeTimers.delete(articleId.toString());
    } catch (err) {
      logger.error(
        `[Scheduler] Failed to publish article ${articleId}: ${err.message}`
      );
    }
  }, delay);

  activeTimers.set(articleId.toString(), timer);
  logger.info(
    `[Scheduler] Article ${articleId} scheduled for ${new Date(publishAt).toISOString()}`
  );
};

const cancelSchedule = (articleId) => {
  const id = articleId.toString();
  if (activeTimers.has(id)) {
    clearTimeout(activeTimers.get(id));
    activeTimers.delete(id);
    logger.info(`[Scheduler] Cancelled schedule for article ${articleId}`);
  }
};

// ============================================================
// VERCEL CRON JOBS (runs on every cron trigger)
// Each job is independent — one failure won't stop others
// ============================================================

/**
 * Publishes any scheduled articles whose scheduledAt has passed.
 * This is the VERCEL-SAFE fallback for the setTimeout system.
 * Catches articles that were missed if the server was cold.
 */
const publishOverdueArticles = async () => {
  try {
    const overdue = await Article.find({
      status: "scheduled",
      scheduledAt: { $lte: new Date() },
    });

    if (overdue.length === 0) {
      logger.info("✓ No overdue articles to publish.");
      return;
    }

    for (const article of overdue) {
      article.status = "published";
      article.publishedAt = new Date();
      await article.save();

      // Also clear from in-process timer map if it exists
      cancelSchedule(article._id);

      logger.info(`✓ [Cron] Published overdue article: ${article._id}`);
    }

    logger.info(`✓ Published ${overdue.length} overdue article(s).`);
  } catch (err) {
    logger.error(`✗ publishOverdueArticles failed: ${err.message}`);
  }
};

/**
 * Cleans up expired password reset / email verify tokens from User model
 */
const cleanExpiredTokens = async () => {
  try {
    await User.updateMany(
      { resetTokenExpiry: { $lt: new Date() } },
      { $unset: { resetToken: "", resetTokenExpiry: "" } }
    );
    logger.info("✓ Expired tokens cleaned.");
  } catch (err) {
    logger.error(`✗ cleanExpiredTokens failed: ${err.message}`);
  }
};

/**
 * Deletes activity logs older than 30 days
 */
const cleanOldActivityLogs = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await ActivityLog.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
    });
    logger.info(`✓ Deleted ${result.deletedCount} old activity log(s).`);
  } catch (err) {
    logger.error(`✗ cleanOldActivityLogs failed: ${err.message}`);
  }
};

/**
 * Processes and sends any pending scheduled newsletters
 */
const sendScheduledNewsletters = async () => {
  try {
    // Replace with your actual Newsletter logic
    // e.g. find newsletters where sendAt <= now and status === 'pending'
    logger.info("✓ Newsletters processed.");
  } catch (err) {
    logger.error(`✗ sendScheduledNewsletters failed: ${err.message}`);
  }
};

/**
 * Master function called by the cron endpoint.
 * Uses Promise.allSettled so all jobs run even if one fails.
 */
const runAllJobs = async () => {
  logger.info("=== [Cron] Running all scheduled jobs ===");

  const results = await Promise.allSettled([
    publishOverdueArticles(),
    cleanExpiredTokens(),
    cleanOldActivityLogs(),
    sendScheduledNewsletters(),
  ]);

  // Log any unexpected rejections
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      logger.error(`[Cron] Job ${i} rejected: ${result.reason}`);
    }
  });

  logger.info("=== [Cron] All jobs completed ===");
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // In-process timer system
  initQueues,
  scheduleArticlePublish,
  cancelSchedule,

  // Vercel cron system
  runAllJobs,
};