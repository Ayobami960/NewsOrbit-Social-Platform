const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/MessageChat");

const SUPPORT_ROLES = ["super_admin", "manager"];
const isSupport = (role) => SUPPORT_ROLES.includes(role);

// ── Online registry: userId → Set<socketId> ───────────────────────────────────
const online = new Map();

const addOnline = (uid, sid) => { if (!online.has(uid)) online.set(uid, new Set()); online.get(uid).add(sid); };
const removeOnline = (uid, sid) => { online.get(uid)?.delete(sid); if (online.get(uid)?.size === 0) online.delete(uid); };
const isOnline = (uid) => (online.get(uid?.toString())?.size ?? 0) > 0;

/** Emit to all open sockets of a user */
function emitToUser(io, userId, event, data) {
  online.get(userId?.toString())?.forEach((sid) => io.to(sid).emit(event, data));
}

/** Emit to all online support staff */
function emitToSupport(io, event, data) {
  online.forEach((sockets) => {
    sockets.forEach((sid) => io.to(sid).emit(event, data));
  });
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
    transports: ["websocket", "polling"],
  });

  // ── Auth middleware ──────────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) return next(new Error("NO_TOKEN"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("name role avatar isActive isBanned");

      if (!user) return next(new Error("USER_NOT_FOUND"));
      if (!user.isActive) return next(new Error("ACCOUNT_INACTIVE"));
      if (user.isBanned) return next(new Error("ACCOUNT_BANNED"));

      socket.user = user;
      next();
    } catch {
      next(new Error("AUTH_FAILED"));
    }
  });

  // ── Rooms convention ─────────────────────────────────────────────────────────
  // conversation:{id}  → everyone in a thread (user + any support agent who joined)
  // support:inbox      → all online support staff (for new-conversation notifications)

  io.on("connection", (socket) => {
    const uid = socket.user._id.toString();
    const role = socket.user.role;

    addOnline(uid, socket.id);

    // Support staff auto-join the shared inbox room
    if (isSupport(role)) {
      socket.join("support:inbox");
    }

    // Tell everyone this user is online
    socket.broadcast.emit("presence", { userId: uid, online: true });

    // ────────────────────────────────────────────────────────────────────────
    // join_conversation
    // User calls this once to subscribe to their thread.
    // Support staff call this when they open a specific conversation.
    // ────────────────────────────────────────────────────────────────────────
    socket.on("join_conversation", async ({ conversationId }, ack) => {
      try {
        let convo;

        if (isSupport(role)) {
          convo = await Conversation.findById(conversationId);
        } else {
          // User can only join their own conversation
          convo = await Conversation.findOne({ _id: conversationId, user: socket.user._id });
        }

        if (!convo) return ack?.({ success: false, error: "Not found." });

        socket.join(`conversation:${conversationId}`);

        // Add this agent to participants if not already there
        if (isSupport(role) && !convo.participants.map(String).includes(uid)) {
          convo.participants.push(socket.user._id);
          await convo.save();
        }

        // Return online status of ALL participants so the joining client
        // can immediately render the correct presence indicator
        const presenceMap = {};
        convo.participants.forEach((pid) => {
          presenceMap[pid.toString()] = isOnline(pid.toString());
        });
        // Always include the conversation owner
        presenceMap[convo.user.toString()] = isOnline(convo.user.toString());

        ack?.({ success: true, isUserOnline: isOnline(convo.user?.toString()), presenceMap });
      } catch (err) {
        console.error("[socket] join_conversation:", err?.message || err);
        ack?.({ success: false, error: "Server error." });
      }
    });

    // ────────────────────────────────────────────────────────────────────────
    // send_message
    // ────────────────────────────────────────────────────────────────────────
    socket.on("send_message", async ({ conversationId, body }, ack) => {
      try {
        const text = body?.trim();
        if (!text) return ack?.({ success: false, error: "Empty message." });
        if (text.length > 2000) return ack?.({ success: false, error: "Too long." });

        // Verify access
        let convo;
        if (isSupport(role)) {
          convo = await Conversation.findById(conversationId);
        } else {
          convo = await Conversation.findOne({ _id: conversationId, user: socket.user._id });
        }
        if (!convo) return ack?.({ success: false, error: "Not found." });
        if (convo.status === "closed") return ack?.({ success: false, error: "Conversation is closed." });

        const senderType = isSupport(role) ? "support" : "user";

        // Persist
        const message = await Message.create({
          conversation: convo._id,
          sender: socket.user._id,
          senderType,
          body: text,
        });

        await message.populate("sender", "name avatar role");

        // Update conversation snapshot
        convo.lastMessage = {
          body: text,
          sender: socket.user._id,
          senderName: socket.user.name,
          createdAt: message.createdAt,
        };

        // Ensure a brand new conversation is explicitly marked open —
        // guards against status ever being left undefined on old/edge-case docs
        if (!convo.status) convo.status = "open";

        if (senderType === "user") {
          convo.supportUnread += 1;
        } else {
          convo.userUnread += 1;
          // Assign to this agent if not yet assigned
          if (!convo.assignedTo) convo.assignedTo = socket.user._id;
        }
        await convo.save();

        const payload = { message, conversationId: convo._id.toString() };

        // Broadcast to everyone in the thread room
        io.to(`conversation:${convo._id}`).emit("new_message", payload);

        // Also push a lighter "inbox_update" to the support inbox room
        // so the conversation list updates in real-time even without being opened
        if (senderType === "user") {
          io.to("support:inbox").emit("inbox_update", {
            conversationId: convo._id.toString(),
            lastMessage: convo.lastMessage,
            supportUnread: convo.supportUnread,
            userId: convo.user.toString(),
          });
        } else {
          // Notify the user if they're online but not in the room
          emitToUser(io, convo.user.toString(), "inbox_update", {
            conversationId: convo._id.toString(),
            lastMessage: convo.lastMessage,
            userUnread: convo.userUnread,
          });
        }

        ack?.({ success: true, message });
      } catch (err) {
        console.error("[socket] send_message:", err?.message || err);
        ack?.({ success: false, error: "Failed to send." });
      }
    });

    // ────────────────────────────────────────────────────────────────────────
    // message_read
    // ────────────────────────────────────────────────────────────────────────
    socket.on("message_read", async ({ conversationId }) => {
      try {
        const convo = await Conversation.findById(conversationId);
        if (!convo) return;

        const now = new Date();
        const senderTypeToMark = isSupport(role) ? "user" : "support";

        await Message.updateMany(
          { conversation: conversationId, senderType: senderTypeToMark, readAt: null },
          { $set: { readAt: now } }
        );

        if (isSupport(role)) {
          convo.supportUnread = 0;
        } else {
          convo.userUnread = 0;
        }
        await convo.save();

        // Notify the other party their messages were read
        socket.to(`conversation:${conversationId}`).emit("read_receipt", {
          conversationId,
          readBy: uid,
          readAt: now,
        });
      } catch (err) {
        console.error("[socket] message_read:", err?.message || err);
      }
    });

    // ────────────────────────────────────────────────────────────────────────
    // get_online_status  — ask if specific userIds are currently online
    // Client calls this after joining a conversation to check the other party
    // ────────────────────────────────────────────────────────────────────────
    socket.on("get_online_status", ({ userIds }, ack) => {
      const result = {};

      if (Array.isArray(userIds)) {
        userIds.forEach((id) => {
          result[id] = isOnline(id);
        });
      }

      if (typeof ack === "function") {
        ack(result);
      }
    });

    // ────────────────────────────────────────────────────────────────────────
    // typing
    // ────────────────────────────────────────────────────────────────────────
    socket.on("typing", ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit("typing_indicator", {
        conversationId,
        userId: uid,
        name: socket.user.name,
        isTyping,
        senderType: isSupport(role) ? "support" : "user",
      });
    });

    // ────────────────────────────────────────────────────────────────────────
    // disconnect
    // ────────────────────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      removeOnline(uid, socket.id);
      if (!isOnline(uid)) {
        socket.broadcast.emit("presence", { userId: uid, online: false });
      }
    });
  });

  return io;
}

// Exported so REST controllers (e.g. chat.controller.js listInbox) can enrich
// their responses with live online status without duplicating the registry.
module.exports = { initSocket, isOnline, SUPPORT_ROLES };