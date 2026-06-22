const webpush = require("web-push");
const env = require("../lib/env");
const logger = require("./logger");

// Validate environment variables
const VAPID_EMAIL = env.VAPID_EMAIL;
const VAPID_PUBLIC_KEY = env.VAPID_PUBLIC_KEY?.trim();
const VAPID_PRIVATE_KEY = env.VAPID_PRIVATE_KEY?.trim();

if (!VAPID_EMAIL || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error("❌ Missing VAPID configuration in .env file");
  console.error("Please set: VAPID_EMAIL, VAPID_PUBLIC_KEY, and VAPID_PRIVATE_KEY");
  process.exit(1);
}

// Set VAPID details
webpush.setVapidDetails(
  VAPID_EMAIL, 
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

console.log("✅ Web Push service initialized successfully");

const sendPushToOne = async (sub, payload) => {
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth
        }
      },
      JSON.stringify(payload),
      {
        TTL: 60 * 60 * 24,
      }
    );
    return true;
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      return "expired";
    }
    if (err.statusCode === 401) {
      logger.error("Push: Unauthorized - Check VAPID keys");
    }
    logger.error(`Push notification failed: ${err.message}`);
    return false;
  }
};

const broadcastPush = async (payload) => {
  const PushSub = require("../models/PushSubscription");
  const subs = await PushSub.find({ isActive: true }).lean();

  let sent = 0, expired = 0;

  await Promise.allSettled(
    subs.map(async (sub) => {
      const result = await sendPushToOne(sub, payload);
      if (result === "expired") {
        await PushSub.findByIdAndUpdate(sub._id, { isActive: false });
        expired++;
      } else if (result === true) {
        sent++;
      }
    })
  );

  logger.info(`Push broadcast completed → Sent: ${sent}, Expired: ${expired}`);
  return { sent, expired };
};

const notifyFollowers = async (followerIds, payload) => {
  if (!followerIds?.length) return { sent: 0, expired: 0 };

  const PushSub = require("../models/PushSubscription");
  const subs = await PushSub.find({ 
    user: { $in: followerIds }, 
    isActive: true 
  }).lean();

  let sent = 0, expired = 0;

  await Promise.allSettled(
    subs.map(async (sub) => {
      const result = await sendPushToOne(sub, payload);
      if (result === "expired") {
        await PushSub.findByIdAndUpdate(sub._id, { isActive: false });
        expired++;
      } else if (result === true) {
        sent++;
      }
    })
  );

  return { sent, expired };
};

module.exports = { 
  broadcastPush, 
  notifyFollowers, 
  sendPushToOne 
};