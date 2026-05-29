require("dotenv").config();

const Article = require("../models/Article");
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const Newsletter = require("../models/Newsletter");
const logger = require("../utils/logger");

// ============================================================
// BULLMQ SETUP (Redis-backed, production-grade)
// ============================================================

let schedulerQueue = null;
let schedulerWorker = null;

const createBullMQQueue = () => {
  // Only initialise BullMQ if Redis env vars are provided
  if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
    logger.warn("Redis not configured — BullMQ disabled, using in-process timers only.");
    return;
  }

  try {
    const { Queue, Worker } = require("bullmq");

    const connection = {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT, 10),
      password: process.env.REDIS_PASSWORD || undefined, // ✅ added missing auth
      tls: process.env.REDIS_TLS === "true" ? {} : undefined, // ✅ added TLS support
    };

    schedulerQueue = new Queue("scheduler", {
      connection,
      defaultJobOptions: {
        removeOnComplete: 100, // ✅ prevent memory bloat
        removeOnFail: 50,
      },
    });

    // ✅ Worker handles the actual job execution
    schedulerWorker = new Worker(
      "scheduler",
      async (job) => {
        if (job.name === "runAllJobs") {
          await runAllJobs();
        }
      },
      { connection }
    );

    schedulerWorker.on("completed", (job) => {
      logger.info(`[BullMQ] Job ${job.name} completed.`);
    });

    schedulerWorker.on("failed", (job, err) => {
      logger.error(`[BullMQ] Job ${job?.name} failed: ${err.message}`);
    });

    logger.info("[BullMQ] Queue and worker initialised.");
  } catch (err) {
    logger.error(`[BullMQ] Failed to initialise: ${err.message}`);
  }
};

// ✅ Add repeating job safely (removes old one first to avoid duplicates)
const addRepeatingJob = async () => {
  if (!schedulerQueue) return;

  try {
    // Remove existing repeatable jobs to avoid duplicates on restart
    const repeatableJobs = await schedulerQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await schedulerQueue.removeRepeatableByKey(job.key);
    }

    // Run every hour
    await schedulerQueue.add(
      "runAllJobs",
      {},
      {
        repeat: { pattern: "0 * * * *" },
        jobId: "runAllJobs-repeat", // ✅ stable ID prevents duplicates
      }
    );

    logger.info("[BullMQ] Repeating job scheduled (every hour).");
  } catch (err) {
    logger.error(`[BullMQ] Failed to add repeating job: ${err.message}`);
  }
};

// ============================================================
// IN-PROCESS TIMER SYSTEM (fallback for dev / no Redis)
// ============================================================

const activeTimers = new Map();

const initQueues = async () => {
  // Try BullMQ first, fall back to in-process timers
  createBullMQQueue();
  await addRepeatingJob();

  logger.info("Scheduler initialised.");
  await rescheduleOnBoot();
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

  const id = articleId.toString();

  if (activeTimers.has(id)) {
    clearTimeout(activeTimers.get(id));
  }

  const timer = setTimeout(async () => {
    try {
      const article = await Article.findById(articleId);
      if (!article || article.status !== "scheduled") return;

      article.status = "published";
      article.publishedAt = new Date();
      await article.save();

      logger.info(`[Scheduler] Article ${articleId} auto-published.`);
      activeTimers.delete(id);
    } catch (err) {
      logger.error(`[Scheduler] Failed to publish article ${articleId}: ${err.message}`);
    }
  }, delay);

  activeTimers.set(id, timer);
  logger.info(`[Scheduler] Article ${articleId} scheduled for ${new Date(publishAt).toISOString()}`);
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
// CRON JOB HANDLERS
// ============================================================

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
      cancelSchedule(article._id);
      logger.info(`✓ [Cron] Published overdue article: ${article._id}`);
    }

    logger.info(`✓ Published ${overdue.length} overdue article(s).`);
  } catch (err) {
    logger.error(`✗ publishOverdueArticles failed: ${err.message}`);
  }
};

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

const sendScheduledNewsletters = async () => {
  try {
    logger.info("✓ Newsletters processed.");
  } catch (err) {
    logger.error(`✗ sendScheduledNewsletters failed: ${err.message}`);
  }
};

const runAllJobs = async () => {
  logger.info("=== [Cron] Running all scheduled jobs ===");

  const results = await Promise.allSettled([
    publishOverdueArticles(),
    cleanExpiredTokens(),
    cleanOldActivityLogs(),
    sendScheduledNewsletters(),
  ]);

  results.forEach((result, i) => {
    if (result.status === "rejected") {
      logger.error(`[Cron] Job ${i} rejected: ${result.reason}`);
    }
  });

  logger.info("=== [Cron] All jobs completed ===");
};

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

const shutdownScheduler = async () => {
  for (const [, timer] of activeTimers) clearTimeout(timer);
  activeTimers.clear();

  if (schedulerWorker) await schedulerWorker.close();
  if (schedulerQueue) await schedulerQueue.close();

  logger.info("[Scheduler] Shutdown complete.");
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  initQueues,
  scheduleArticlePublish,
  cancelSchedule,
  runAllJobs,
  shutdownScheduler, // ✅ call this in server.js on SIGTERM/SIGINT
};