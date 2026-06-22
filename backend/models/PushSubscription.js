

// module.exports = mongoose.model("PushSubscription", pushSubscriptionSchema);
const mongoose = require("mongoose");
const pushSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  endpoint: { type: String, required: true, unique: true },
  keys: { p256dh: { type: String, required: true }, auth: { type: String, required: true } },
  userAgent: String,
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });
pushSchema.index({ user: 1 });
pushSchema.index({ isActive: 1 });
module.exports = mongoose.model("PushSubscription", pushSchema);