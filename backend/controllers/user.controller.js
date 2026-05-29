const User = require("../models/User");
const { uploadToImageKit, deleteFromImageKit } = require("../lib/upload"); // consistent import
const { sanitiseFilename } = require("../middlewares/upload");
const { stripHtml }        = require("../utils/sanitise");
const {
  sendSuccess, sendNotFound, sendBadRequest,
} = require("../utils/apiResponse");

// ── GET /api/v1/users/me ─────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -refreshToken -__v -emailVerifyCode -emailVerifyExpires -passwordResetCode -passwordResetExpires -failedLoginAttempts -lockUntil -lastLoginIp -inviteToken -inviteExpires -inviteOtp -inviteOtpExpires");
      // No .lean() — let toJSON() run to strip sensitive fields by role

    if (!user || !user.isActive) return sendNotFound(res, "User not found.");

    return sendSuccess(res, { user });
  } catch (err) { next(err); }
};

// ── GET /api/v1/users/writers ─────────────────────────────────────────────────
exports.getWriters = async (req, res, next) => {
  try {
    const { page = 1, limit = 24, search } = req.query;
    const filter = { role: "writer", isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { bio:  { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select("name avatar bio role socialLinks stats followersCount followingCount isVerified createdAt")
        .sort("-createdAt")
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      User.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      users,
      pagination: { page: +page, limit: +limit, total },
    });
  } catch (err) { next(err); }
};

// ── GET /api/v1/users/public/:id ─────────────────────────────────────────────
exports.getPublicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("name avatar bio role socialLinks stats followersCount followingCount createdAt isVerified isActive");

    if (!user || !user.isActive) return sendNotFound(res, "User not found.");

    const userObj = user.toObject();
    delete userObj.isActive;

    return sendSuccess(res, { user: userObj });
  } catch (err) { next(err); }
};

// ── PATCH /api/v1/users/me ───────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, socialLinks } = req.body;

    const update = {};

    if (name) update.name = stripHtml(name).slice(0, 80);
    if (bio)  update.bio  = stripHtml(bio).slice(0, 500);

    if (socialLinks) {
      try {
        const parsed = typeof socialLinks === "string"
          ? JSON.parse(socialLinks)
          : socialLinks;

        update.socialLinks = {
          ...(parsed.twitter   && { twitter:   stripHtml(parsed.twitter).slice(0, 200)   }),
          ...(parsed.facebook  && { facebook:  stripHtml(parsed.facebook).slice(0, 200)  }),
          ...(parsed.instagram && { instagram: stripHtml(parsed.instagram).slice(0, 200) }),
        };
      } catch {
        return sendBadRequest(res, "Invalid socialLinks format.");
      }
    }

    if (req.files?.avatar?.[0]) {
      const file = req.files.avatar[0];

      const existing = await User.findById(req.user._id).select("avatar");
      if (existing?.avatar?.fileId) {
        await deleteFromImageKit(existing.avatar.fileId).catch(() => {});
      }

      const uploaded = await uploadToImageKit(file, {
        folder: "/avatars",
        fileNamePrefix: sanitiseFilename(file.originalname.replace(/\.[^/.]+$/, "")),
      });

      update.avatar = { url: uploaded.url, fileId: uploaded.fileId };
    }

    if (Object.keys(update).length === 0) {
      return sendBadRequest(res, "No valid fields provided to update.");
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: update },
      { new: true, runValidators: true }
    ).select("-password -refreshToken -__v");

    if (!user) return sendNotFound(res, "User not found.");

    return sendSuccess(res, { user }, "Profile updated successfully.");
  } catch (err) { next(err); }
};

// ── GET /api/v1/users/:id ────────────────────────────────────────────────────
// Admin only — full document
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate("createdBy", "name role");
    if (!user) return sendNotFound(res, "User not found.");
    return sendSuccess(res, { user });
  } catch (err) { next(err); }
};