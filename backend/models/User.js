const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = ["super_admin", "admin", "manager", "writer", "user"];
const FOLLOWABLE_ROLES = ["writer", "user"];

// Roles that must have a partnerCompany
// - admin:  required at invite time (they represent the partner company)
// - writer: inherited from their admin at invite time (never supplied directly)
const COMPANY_ROLES = ["admin", "writer"];
const MANAGER_ROLES = ["manager"]

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 5, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    password: { type: String, required: true, minlength: 8, select: false },

    role: { type: String, enum: ROLES, default: "user" },

    // In your schema — rename the field to camelCase consistently
    inviteManagement: {          // ← your schema has this
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 100,
      required: [
        function () { return MANAGER_ROLES.includes(this.role); },
        "inviteManagement is required for manager roles.",
      ],
      default: null,
    },

    // Required for admin (set at invite) and writer (inherited from admin).
    // Not applicable to super_admin or regular user.
    partnerCompany: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 100,
      required: [
        function () {
          return COMPANY_ROLES.includes(this.role);
        },
        "partnerCompany is required for admin and writer roles.",
      ],
      default: null,
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    avatar: { url: String, fileId: String },
    bio: { type: String, maxlength: 500 },

    inviteToken: { type: String, select: false },
    inviteExpires: { type: Date, select: false },
    isInviteUsed: { type: Boolean, default: false },

    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    inviteOtp: { type: String, select: false },
    inviteOtpExpires: { type: Date, select: false },

    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: "" },

    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },

    emailVerifyCode: { type: String, select: false },
    emailVerifyExpires: { type: Date, select: false },

    passwordResetCode: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    refreshToken: { type: String, select: false },

    stats: {
      totalArticles: { type: Number, default: 0 },
      totalBlogs: { type: Number, default: 0 },
      totalViews: { type: Number, default: 0 },
      totalLikes: { type: Number, default: 0 },
      totalComments: { type: Number, default: 0 },
      totalFollowers: { type: Number, default: 0 },
    },

    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },

    lastLogin: Date,
    lastLoginIp: { type: String, select: false },
    loginCount: { type: Number, default: 0 },

    newsletterSubscribed: { type: Boolean, default: false },
    socialLinks: {
      twitter: String,
      facebook: String,
      instagram: String,
    },
  },
  { timestamps: true }
);

// ====================== INDEXES ======================
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1, isBanned: 1 });
userSchema.index({ createdBy: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ partnerCompany: 1 });

// ====================== MIDDLEWARE ======================
userSchema.pre("save", function (next) {
  if (!FOLLOWABLE_ROLES.includes(this.role)) {
    this.followersCount = 0;
    this.followingCount = 0;
  }
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ====================== METHODS & STATICS ======================
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.statics.canBeFollowed = function (role) {
  return FOLLOWABLE_ROLES.includes(role);
};

userSchema.statics.requiresCompany = function (role) {
  return COMPANY_ROLES.includes(role);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();

  delete obj.password;
  delete obj.refreshToken;
  delete obj.emailVerifyCode;
  delete obj.emailVerifyExpires;
  delete obj.passwordResetCode;
  delete obj.passwordResetExpires;
  delete obj.failedLoginAttempts;
  delete obj.lockUntil;
  delete obj.lastLoginIp;
  delete obj.inviteToken;
  delete obj.inviteExpires;
  delete obj.inviteOtp;
  delete obj.inviteOtpExpires;

  if (!FOLLOWABLE_ROLES.includes(obj.role)) {
    delete obj.followersCount;
    delete obj.followingCount;
  }

  // Hide partnerCompany on roles where it's not applicable
  if (!COMPANY_ROLES.includes(obj.role)) {
    delete obj.partnerCompany;
  }

  return obj;
};

module.exports = mongoose.model("User", userSchema);