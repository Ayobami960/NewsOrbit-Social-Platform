
// ====================== NEWSLETTER MODEL ======================
const mongoose = require("mongoose");
const crypto = require("crypto");

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  confirmedAt: Date,
  unsubscribedAt: Date,
  unsubscribeToken: {
    type: String,
    default: () => crypto.randomBytes(32).toString("hex")
  },
  source: { type: String, default: "website" },
}, { timestamps: true });

// ====================== INDEXES ======================
newsletterSchema.index({ isActive: 1 });
newsletterSchema.index({ unsubscribeToken: 1 });

// Do NOT add index({ email: 1 }) — unique: true already handles it

module.exports = mongoose.model("Newsletter", newsletterSchema);

