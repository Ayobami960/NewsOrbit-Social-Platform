const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth");
const { followUser, unfollowUser, getFollowers, getFollowStatus, getFollowing } = require("../controllers/follow.controller");


router.post  ("/:id", protect, followUser);
router.delete("/:id", protect, unfollowUser);
router.get   ("/:id/followers", getFollowers);
router.get   ("/:id/following", getFollowing);
router.get   ("/:id/follow-status", protect,  getFollowStatus);

module.exports = router;