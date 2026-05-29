

// push.controller.js
const env = require("../lib/env");
const PushSub = require("../models/PushSubscription");
const { broadcastPush } = require("../utils/webpush");
const { sendSuccess, sendCreated, sendError } = require("../utils/apiResponse");

exports.getPublicKey = (req, res) => sendSuccess(res, { publicKey: env.VAPID_PUBLIC_KEY });

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
