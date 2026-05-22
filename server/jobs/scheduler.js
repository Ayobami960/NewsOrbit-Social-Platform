// // const Article = require("../models/Article");
// // const { sendNewsletter } = require("../utils/email");
// // const logger = require("../utils/logger");

// // let queuesEnabled = false;

// // const initQueues = () => {
// //   logger.info("BullMQ skipped — Redis not configured.");
// // };

// // const scheduleArticlePublish = async (articleId, publishAt) => {
// //   logger.warn("Queue disabled: article scheduling requires Redis.");
// // };

// // const queueNewsletter = async (emails, subject, html) => {
// //   logger.warn("Queue disabled: newsletter queuing requires Redis.");
// // };

// // module.exports = { initQueues, scheduleArticlePublish, queueNewsletter };


// const { Queue, Worker, QueueScheduler } = require("bullmq");
// const { getRedis } = require("../config/redis");
// const Article = require("../models/Article");
// const { sendNewsletter } = require("../utils/email");
// const logger = require("../utils/logger");

// let articleQueue;
// let emailQueue;

// const initQueues = () => {
//   const connection = getRedis();

//   // ── Article publish queue ──────────────────────────────────────────────────
//   articleQueue = new Queue("article-publish", { connection });

//   const articleWorker = new Worker(
//     "article-publish",
//     async (job) => {
//       const { articleId } = job.data;
//       logger.info(`[BullMQ] Publishing article: ${articleId}`);

//       const article = await Article.findById(articleId);
//       if (!article) return logger.warn(`Article ${articleId} not found for publishing.`);
//       if (article.status !== "scheduled") return;

//       article.status = "published";
//       article.publishedAt = new Date();
//       await article.save();

//       logger.info(`[BullMQ] Article ${articleId} published.`);
//     },
//     { connection }
//   );

//   articleWorker.on("failed", (job, err) => {
//     logger.error(`[BullMQ] article-publish job ${job.id} failed: ${err.message}`);
//   });

//   // ── Email queue ─────────────────────────────────────────────────────────────
//   emailQueue = new Queue("email-send", { connection });

//   const emailWorker = new Worker(
//     "email-send",
//     async (job) => {
//       const { to, subject, html } = job.data;
//       await sendNewsletter({ to, subject, html });
//       logger.info(`[BullMQ] Email sent to ${Array.isArray(to) ? to.length : 1} recipient(s).`);
//     },
//     { connection, concurrency: 5 }
//   );

//   emailWorker.on("failed", (job, err) => {
//     logger.error(`[BullMQ] email-send job ${job.id} failed: ${err.message}`);
//   });

//   logger.info("BullMQ queues initialised.");
//   return { articleQueue, emailQueue };
// };

// /**
//  * Schedule an article to be published at a specific date.
//  * @param {string} articleId
//  * @param {Date}   publishAt
//  */
// const scheduleArticlePublish = async (articleId, publishAt) => {
//   if (!articleQueue) throw new Error("Queues not initialised.");
//   const delay = new Date(publishAt).getTime() - Date.now();
//   if (delay < 0) throw new Error("scheduledAt must be in the future.");

//   await articleQueue.add(
//     "publish",
//     { articleId: articleId.toString() },
//     { delay, jobId: `publish:${articleId}`, removeOnComplete: true, removeOnFail: 50 }
//   );
// };

// /**
//  * Queue a newsletter broadcast (split into batches).
//  */
// const queueNewsletter = async (emails, subject, html) => {
//   if (!emailQueue) throw new Error("Queues not initialised.");
//   const batchSize = 50;
//   for (let i = 0; i < emails.length; i += batchSize) {
//     const batch = emails.slice(i, i + batchSize);
//     await emailQueue.add("newsletter", { to: batch, subject, html }, {
//       removeOnComplete: true,
//       removeOnFail: 20,
//     });
//   }
// };

// module.exports = { initQueues, scheduleArticlePublish, queueNewsletter };


const Article = require("../models/Article");
const logger  = require("../utils/logger");

const activeTimers = new Map();

const initQueues = () => {
  logger.info("Scheduler initialised (in-process, no Redis required).");
  // On startup, re-schedule any articles that are still scheduled
  rescheduleOnBoot();
};

const rescheduleOnBoot = async () => {
  try {
    const scheduled = await Article.find({ status:"scheduled", scheduledAt:{ $gt:new Date() } }).select("_id scheduledAt");
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

  // Clear existing timer for this article if any
  if (activeTimers.has(articleId.toString())) {
    clearTimeout(activeTimers.get(articleId.toString()));
  }

  const timer = setTimeout(async () => {
    try {
      const article = await Article.findById(articleId);
      if (!article || article.status !== "scheduled") return;
      article.status      = "published";
      article.publishedAt = new Date();
      await article.save();
      logger.info(`[Scheduler] Article ${articleId} auto-published.`);
      activeTimers.delete(articleId.toString());
    } catch (err) {
      logger.error(`[Scheduler] Failed to publish article ${articleId}: ${err.message}`);
    }
  }, delay);

  activeTimers.set(articleId.toString(), timer);
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

module.exports = { initQueues, scheduleArticlePublish, cancelSchedule };