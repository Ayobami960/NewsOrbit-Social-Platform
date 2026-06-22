const Conversation = require("../models/Conversation");
const Message = require("../models/MessageChat");
const User = require("../models/User");
const { isOnline } = require("../config/socket"); // ← same registry the socket layer uses


const SUPPORT_ROLES = ["super_admin", "manager"];

function isSupport(role) {
  return SUPPORT_ROLES.includes(role);
}

// ─────────────────────────────────────────────────────────────────────────────
// USER routes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/chat/my
 * User: get (or auto-create) their conversation with support.
 */
exports.getMyConversation = async (req, res) => {
  if (isSupport(req.user.role)) {
    return res.status(403).json({ success: false, message: "Use the admin inbox endpoint." });
  }

  let convo = await Conversation.findOne({ user: req.user._id })
    .populate("user", "name avatar email role")
    .populate("lastMessage.sender", "name")
    .populate("assignedTo", "name avatar role");

  if (!convo) {
    convo = await Conversation.create({
      user: req.user._id,
      participants: [req.user._id],
      status: "open", // explicit — relying on a schema default has bitten us before
      userUnread: 0,
      supportUnread: 0,
    });
    await convo.populate("user", "name avatar email role");
  }

  res.json({ success: true, message: "OK", data: { conversation: convo } });
};

/**
 * GET /api/v1/chat/my/messages?page=1&limit=30
 * User: paginated message history for their own conversation.
 */
exports.getMyMessages = async (req, res) => {
  if (isSupport(req.user.role)) {
    return res.status(403).json({ success: false, message: "Use admin endpoint." });
  }

  const { page = 1, limit = 30 } = req.query;

  const convo = await Conversation.findOne({ user: req.user._id });
  if (!convo) {
    return res.json({
      success: true,
      message: "OK",
      data: { messages: [], pagination: { page: 1, limit: 30, total: 0, pages: 0 } },
    });
  }

  const [messages, total] = await Promise.all([
    Message.find({ conversation: convo._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("sender", "name avatar role"),
    Message.countDocuments({ conversation: convo._id }),
  ]);

  res.json({
    success: true,
    message: "OK",
    data: {
      conversationId: convo._id,
      messages: messages.reverse(),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
};

/**
 * PATCH /api/v1/chat/my/read
 * User: mark all support messages as read.
 */
exports.markMyRead = async (req, res) => {
  const convo = await Conversation.findOne({ user: req.user._id });
  if (!convo) return res.json({ success: true, message: "OK", data: {} });

  await Message.updateMany(
    { conversation: convo._id, senderType: "support", readAt: null },
    { $set: { readAt: new Date() } }
  );

  convo.userUnread = 0;
  await convo.save();

  res.json({ success: true, message: "Marked as read.", data: {} });
};

// ─────────────────────────────────────────────────────────────────────────────
// SUPPORT (admin/super_admin) routes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/chat/inbox?page=1&limit=20&status=open
 * Support: list all user conversations sorted by latest activity.
 *
 * `status` is OPTIONAL. If the frontend ever sends "all", or omits it,
 * we don't apply a status filter at all — only filter when a specific
 * status ("open" | "closed") is explicitly requested. This avoids the
 * bug where conversations without an explicit/defaulted status field
 * silently vanish from every filtered view.
 */
exports.listInbox = async (req, res) => {
  if (!isSupport(req.user.role)) {
    return res.status(403).json({ success: false, message: "Forbidden." });
  }

  const { page = 1, limit = 20, status, search } = req.query;
  const filter = {};

  if (status && status !== "all") {
    if (status === "open") {
      // Treat missing/null status as open too, so legacy docs created
      // before `status` existed (or without a default) still show up.
      filter.$or = [{ status: "open" }, { status: { $exists: false } }, { status: null }];
    } else {
      filter.status = status;
    }
  }

  // If search, we need to look up users first
  if (search) {
    const matchingUsers = await User.find({
      $or: [
        { name:  { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }).select("_id");
    const userIds = matchingUsers.map((u) => u._id);

    // Merge with any existing $or from the status filter using $and,
    // so search and status both apply correctly together.
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { user: { $in: userIds } }];
      delete filter.$or;
    } else {
      filter.user = { $in: userIds };
    }
  }

  const [convos, total] = await Promise.all([
    Conversation.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("user", "name avatar email role")
      .populate("assignedTo", "name avatar role")
      .populate("lastMessage.sender", "name"),
    Conversation.countDocuments(filter),
  ]);

  // Enrich each conversation with live online status for its owning user,
  // using the same in-memory registry the socket layer maintains — this
  // means the very first REST load already has correct presence, instead
  // of waiting for a "presence" socket event to arrive.
  const conversations = convos.map((c) => {
    const obj = c.toObject();
    obj.isUserOnline = isOnline(c.user?._id?.toString());
    return obj;
  });

  res.json({
    success: true,
    message: "OK",
    data: {
      conversations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
};

/**
 * GET /api/v1/chat/inbox/:conversationId/messages?page=1&limit=30
 * Support: get messages for a specific conversation.
 */
exports.getInboxMessages = async (req, res) => {
  if (!isSupport(req.user.role)) {
    return res.status(403).json({ success: false, message: "Forbidden." });
  }

  const { page = 1, limit = 30 } = req.query;

  const convo = await Conversation.findById(req.params.conversationId)
    .populate("user", "name avatar email role")
    .populate("assignedTo", "name avatar role");

  if (!convo) {
    return res.status(404).json({ success: false, message: "Conversation not found." });
  }

  const [messages, total] = await Promise.all([
    Message.find({ conversation: convo._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("sender", "name avatar role"),
    Message.countDocuments({ conversation: convo._id }),
  ]);

  res.json({
    success: true,
    message: "OK",
    data: {
      conversation: convo,
      messages: messages.reverse(),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
};

/**
 * PATCH /api/v1/chat/inbox/:conversationId/read
 * Support: mark all user messages in this conversation as read.
 */
exports.markInboxRead = async (req, res) => {
  if (!isSupport(req.user.role)) {
    return res.status(403).json({ success: false, message: "Forbidden." });
  }

  const convo = await Conversation.findById(req.params.conversationId);
  if (!convo) return res.status(404).json({ success: false, message: "Not found." });

  await Message.updateMany(
    { conversation: convo._id, senderType: "user", readAt: null },
    { $set: { readAt: new Date() } }
  );

  convo.supportUnread = 0;
  await convo.save();

  res.json({ success: true, message: "Marked as read.", data: {} });
};

/**
 * PATCH /api/v1/chat/inbox/:conversationId/assign
 * Support: assign this conversation to an agent (or self).
 */
exports.assignConversation = async (req, res) => {
  if (!isSupport(req.user.role)) {
    return res.status(403).json({ success: false, message: "Forbidden." });
  }

  const convo = await Conversation.findByIdAndUpdate(
    req.params.conversationId,
    { assignedTo: req.body.agentId ?? req.user._id },
    { new: true }
  ).populate("assignedTo", "name avatar role");

  if (!convo) return res.status(404).json({ success: false, message: "Not found." });

  res.json({ success: true, message: "Assigned.", data: { conversation: convo } });
};

/**
 * PATCH /api/v1/chat/inbox/:conversationId/close
 * Support: close a conversation.
 */
exports.closeConversation = async (req, res) => {
  if (!isSupport(req.user.role)) {
    return res.status(403).json({ success: false, message: "Forbidden." });
  }

  const convo = await Conversation.findByIdAndUpdate(
    req.params.conversationId,
    { status: "closed" },
    { new: true }
  );
  if (!convo) return res.status(404).json({ success: false, message: "Not found." });

  res.json({ success: true, message: "Closed.", data: {} });
};