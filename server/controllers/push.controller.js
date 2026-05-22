// const PushSubscription = require("../models/PushSubscription");
// const { broadcastPush } = require("../utils/webpush");
// const { sendSuccess, sendCreated, sendError } = require("../utils/apiResponse");

// // ── GET /api/v1/push/vapid-public-key ───────────────────────────────────────
// // Frontend needs this key to register the service worker subscription
// exports.getPublicKey = (req, res) => {
//   return sendSuccess(res, { publicKey: process.env.VAPID_PUBLIC_KEY });
// };

// // ── POST /api/v1/push/subscribe ─────────────────────────────────────────────
// exports.subscribe = async (req, res, next) => {
//   try {
//     const { endpoint, keys } = req.body;

//     if (!endpoint || !keys?.p256dh || !keys?.auth) {
//       return sendError(res, "Invalid push subscription object.", 400);
//     }

//     await PushSubscription.findOneAndUpdate(
//       { endpoint },
//       {
//         endpoint,
//         keys,
//         user:      req.user?._id || null,
//         userAgent: req.headers["user-agent"],
//         isActive:  true,
//       },
//       { upsert: true, new: true }
//     );

//     return sendCreated(res, {}, "Push subscription registered.");
//   } catch (err) {
//     next(err);
//   }
// };

// // ── DELETE /api/v1/push/unsubscribe ─────────────────────────────────────────
// exports.unsubscribe = async (req, res, next) => {
//   try {
//     const { endpoint } = req.body;
//     if (!endpoint) return sendError(res, "endpoint is required.", 400);

//     await PushSubscription.findOneAndUpdate({ endpoint }, { isActive: false });
//     return sendSuccess(res, {}, "Push subscription removed.");
//   } catch (err) {
//     next(err);
//   }
// };

// // ── POST /api/v1/push/broadcast ─────────────────────────────────────────────
// // Admin only — manually send push to all subscribers
// exports.broadcast = async (req, res, next) => {
//   try {
//     const { title, body, url } = req.body;
//     if (!title || !body) return sendError(res, "title and body are required.", 400);

//     const result = await broadcastPush({ title, body, url: url || "/" });
//     return sendSuccess(res, result, `Broadcast sent to ${result.sent} subscribers.`);
//   } catch (err) {
//     next(err);
//   }
// };



// push.controller.js
const PushSub = require("../models/PushSubscription");
const { broadcastPush } = require("../utils/webpush");
const { sendSuccess, sendCreated, sendError } = require("../utils/apiResponse");

exports.getPublicKey = (req, res) => sendSuccess(res, { publicKey: process.env.VAPID_PUBLIC_KEY });

exports.subscribe = async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) return sendError(res, "Invalid subscription.", 400);
    await PushSub.findOneAndUpdate({ endpoint },
      { endpoint, keys, user:req.user?._id||null, userAgent:req.headers["user-agent"], isActive:true },
      { upsert:true, new:true }
    );
    return sendCreated(res, {}, "Push subscription saved.");
  } catch (err) { next(err); }
};

exports.unsubscribe = async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return sendError(res, "endpoint required.", 400);
    await PushSub.findOneAndUpdate({ endpoint }, { isActive:false });
    return sendSuccess(res, {}, "Unsubscribed from push.");
  } catch (err) { next(err); }
};

exports.broadcast = async (req, res, next) => {
  try {
    const { title, body, url } = req.body;
    if (!title || !body) return sendError(res, "title and body required.", 400);
    const result = await broadcastPush({ title, body, url:url||"/" });
    return sendSuccess(res, result, `Sent to ${result.sent} devices.`);
  } catch (err) { next(err); }
};
