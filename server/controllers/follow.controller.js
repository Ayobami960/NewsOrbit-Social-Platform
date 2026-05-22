// const Follow = require("../models/Follow");
// const User = require("../models/User");
// const { notifyNewFollower } = require("../utils/notifications");
// const { log } = require("../models/ActivityLog");
// const {
//   sendSuccess, sendError, sendNotFound,
// } = require("../utils/apiResponse");

// // ── POST /api/v1/users/:id/follow ────────────────────────────────────────────
// exports.followUser = async (req, res, next) => {
//   try {
//     const targetId = req.params.id;
//     const myId     = req.user._id.toString();

//     // Can't follow yourself
//     if (targetId === myId) {
//       return sendError(res, "You cannot follow yourself.", 400);
//     }

//     const target = await User.findById(targetId);
//     if (!target || !target.isActive) return sendNotFound(res, "User not found.");

//     // Check if already following
//     const existing = await Follow.findOne({ follower: myId, following: targetId });
//     if (existing) return sendError(res, "You are already following this user.", 409);

//     // Create follow relationship
//     await Follow.create({ follower: myId, following: targetId });

//     // Update counts on both users
//     await Promise.all([
//       User.findByIdAndUpdate(myId,     { $inc: { followingCount: 1 } }),
//       User.findByIdAndUpdate(targetId, { $inc: { followersCount: 1 } }),
//     ]);

//     // Send in-app notification to the followed user
//     notifyNewFollower(targetId, req.user).catch(() => {});

//     log({
//       user:     req.user._id,
//       action:   "user_follow",
//       resource: targetId,
//       ip:       req.ip,
//     });

//     return sendSuccess(res, {}, `You are now following ${target.name}.`);
//   } catch (err) {
//     next(err);
//   }
// };

// // ── DELETE /api/v1/users/:id/follow ─────────────────────────────────────────
// exports.unfollowUser = async (req, res, next) => {
//   try {
//     const targetId = req.params.id;
//     const myId     = req.user._id.toString();

//     const follow = await Follow.findOneAndDelete({
//       follower:  myId,
//       following: targetId,
//     });

//     if (!follow) return sendError(res, "You are not following this user.", 400);

//     // Update counts
//     await Promise.all([
//       User.findByIdAndUpdate(myId,     { $inc: { followingCount: -1 } }),
//       User.findByIdAndUpdate(targetId, { $inc: { followersCount: -1 } }),
//     ]);

//     log({
//       user:     req.user._id,
//       action:   "user_unfollow",
//       resource: targetId,
//       ip:       req.ip,
//     });

//     return sendSuccess(res, {}, "Unfollowed successfully.");
//   } catch (err) {
//     next(err);
//   }
// };

// // ── GET /api/v1/users/:id/followers ─────────────────────────────────────────
// exports.getFollowers = async (req, res, next) => {
//   try {
//     const { page = 1, limit = 20 } = req.query;
//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     const [follows, total] = await Promise.all([
//       Follow.find({ following: req.params.id })
//         .sort("-createdAt")
//         .skip(skip)
//         .limit(parseInt(limit))
//         .populate("follower", "name avatar bio followersCount"),
//       Follow.countDocuments({ following: req.params.id }),
//     ]);

//     const followers = follows.map((f) => f.follower);
//     return sendSuccess(res, { followers, total });
//   } catch (err) {
//     next(err);
//   }
// };

// // ── GET /api/v1/users/:id/following ─────────────────────────────────────────
// exports.getFollowing = async (req, res, next) => {
//   try {
//     const { page = 1, limit = 20 } = req.query;
//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     const [follows, total] = await Promise.all([
//       Follow.find({ follower: req.params.id })
//         .sort("-createdAt")
//         .skip(skip)
//         .limit(parseInt(limit))
//         .populate("following", "name avatar bio followersCount role"),
//       Follow.countDocuments({ follower: req.params.id }),
//     ]);

//     const following = follows.map((f) => f.following);
//     return sendSuccess(res, { following, total });
//   } catch (err) {
//     next(err);
//   }
// };

// // ── GET /api/v1/users/:id/follow-status ─────────────────────────────────────
// // Check if the current logged-in user follows this profile
// exports.getFollowStatus = async (req, res, next) => {
//   try {
//     const isFollowing = await Follow.exists({
//       follower:  req.user._id,
//       following: req.params.id,
//     });
//     return sendSuccess(res, { isFollowing: !!isFollowing });
//   } catch (err) {
//     next(err);
//   }
// };



const Follow = require("../models/Follow");
const User   = require("../models/User");
const { notifyNewFollower } = require("../utils/notifications");
const { log } = require("../models/ActivityLog");
const { sendSuccess, sendError, sendNotFound } = require("../utils/apiResponse");

exports.followUser = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const myId     = req.user._id.toString();
    if (targetId === myId) return sendError(res, "Cannot follow yourself.", 400);
    const target = await User.findById(targetId);
    if (!target || !target.isActive) return sendNotFound(res, "User not found.");
    if (!User.canBeFollowed(target.role)) {
      return sendError(res, "You cannot follow this account.", 403);
    }
    const exists = await Follow.findOne({ follower:myId, following:targetId });
    if (exists) return sendError(res, "Already following.", 409);
    await Follow.create({ follower:myId, following:targetId });
    await Promise.all([
      User.findByIdAndUpdate(myId,     { $inc:{ followingCount:1 } }),
      User.findByIdAndUpdate(targetId, { $inc:{ followersCount:1, "stats.totalFollowers":1 } }),
    ]);
    notifyNewFollower(targetId, req.user).catch(()=>{});
    log({ user:req.user._id, action:"user_follow", resource:targetId, ip:req.ip });
    return sendSuccess(res, {}, `Now following ${target.name}.`);
  } catch (err) { next(err); }
};

exports.unfollowUser = async (req, res, next) => {
  try {
    const follow = await Follow.findOneAndDelete({ follower:req.user._id, following:req.params.id });
    if (!follow) return sendError(res, "Not following this user.", 400);
    await Promise.all([
      User.findByIdAndUpdate(req.user._id, { $inc:{ followingCount:-1 } }),
      User.findByIdAndUpdate(req.params.id, { $inc:{ followersCount:-1, "stats.totalFollowers":-1 } }),
    ]);
    log({ user:req.user._id, action:"user_unfollow", resource:req.params.id, ip:req.ip });
    return sendSuccess(res, {}, "Unfollowed.");
  } catch (err) { next(err); }
};

exports.getFollowers = async (req, res, next) => {
  try {
    const { page=1, limit=20 } = req.query;
    const [follows, total] = await Promise.all([
      Follow.find({ following:req.params.id }).sort("-createdAt")
        .skip((+page-1)*+limit).limit(+limit)
        .populate("follower","name avatar bio followersCount"),
      Follow.countDocuments({ following:req.params.id }),
    ]);
    return sendSuccess(res, { followers:follows.map(f=>f.follower), total });
  } catch (err) { next(err); }
};

exports.getFollowing = async (req, res, next) => {
  try {
    const { page=1, limit=20 } = req.query;
    const [follows, total] = await Promise.all([
      Follow.find({ follower:req.params.id }).sort("-createdAt")
        .skip((+page-1)*+limit).limit(+limit)
        .populate("following","name avatar bio followersCount role"),
      Follow.countDocuments({ follower:req.params.id }),
    ]);
    return sendSuccess(res, { following:follows.map(f=>f.following), total });
  } catch (err) { next(err); }
};

exports.getFollowStatus = async (req, res, next) => {
  try {
    const isFollowing = await Follow.exists({ follower:req.user._id, following:req.params.id });
    return sendSuccess(res, { isFollowing:!!isFollowing });
  } catch (err) { next(err); }
};