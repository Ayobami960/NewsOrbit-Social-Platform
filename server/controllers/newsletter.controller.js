

const Newsletter = require("../models/Newsletter");
const { sendEmail, sendNewsletter, templates } = require("../utils/email");
const { broadcastPush } = require("../utils/webpush");
const { sendSuccess, sendCreated, sendError, sendNotFound } = require("../utils/apiResponse");

exports.subscribe = async (req, res, next) => {
  try {
    const { email, name } = req.body;
    const existing = await Newsletter.findOne({ email });
    if (existing) {
      if (existing.isActive) return sendError(res, "Already subscribed.", 409);
      existing.isActive = true; existing.unsubscribedAt = undefined;
      await existing.save();
      return sendSuccess(res, {}, "Subscription re-activated!");
    }
    await Newsletter.create({ email, name });
    const { subject, html } = templates.welcomeNewsletter();
    await sendEmail({ to:email, subject, html }).catch(()=>{});
    return sendCreated(res, {}, "Subscribed successfully!");
  } catch (err) { next(err); }
};

exports.unsubscribe = async (req, res, next) => {
  try {
    const sub = await Newsletter.findOne({ unsubscribeToken:req.query.token });
    if (!sub) return sendNotFound(res, "Subscription not found.");
    sub.isActive = false; sub.unsubscribedAt = new Date();
    await sub.save();
    return sendSuccess(res, {}, "Unsubscribed.");
  } catch (err) { next(err); }
};

exports.getSubscribers = async (req, res, next) => {
  try {
    const { page=1, limit=50, isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === "true";
    const [subscribers, total] = await Promise.all([
      Newsletter.find(filter).sort("-createdAt").skip((+page-1)*+limit).limit(+limit),
      Newsletter.countDocuments(filter),
    ]);
    return sendSuccess(res, { subscribers, total });
  } catch (err) { next(err); }
};

exports.sendBroadcast = async (req, res, next) => {
  try {
    const { subject, html, pushTitle, pushBody, articleUrl } = req.body;
    if (!subject || !html) return sendError(res, "subject and html required.", 400);
    const subs   = await Newsletter.find({ isActive:true }).select("email").lean();
    const emails = subs.map(s=>s.email);
    if (!emails.length) return sendError(res, "No active subscribers.", 400);
    for (let i=0; i<emails.length; i+=50) {
      await sendNewsletter({ to:emails.slice(i,i+50), subject, html }).catch(()=>{});
    }
    if (pushTitle && pushBody) {
      await broadcastPush({ title:pushTitle, body:pushBody, icon:"/icon-192.png", url:articleUrl||"/" }).catch(()=>{});
    }
    return sendSuccess(res, { sent:emails.length }, `Sent to ${emails.length} subscribers.`);
  } catch (err) { next(err); }
};