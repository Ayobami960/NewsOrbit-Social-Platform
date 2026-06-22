
const ContactMessage = require("../models/ContactMessage");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendContactNotificationToAdmin, sendReplyToUser } = require("../utils/email");

// POST /api/v1/contact  — public
exports.submitContact= async (req, res) =>  {
  const { name, email, subject, message, topic } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  const doc = await ContactMessage.create({
    name, email, subject, message,
    topic: topic ?? "general",
    user:  req.user?._id ?? null,   // attach if logged in
  });

  // Notify super_admin by email (non-blocking)
  sendContactNotificationToAdmin({ name, email, subject, message, topic }).catch(console.error);

  // In-app notification for every super_admin
  const superAdmins = await User.find({ role: "super_admin" }).select("_id");
  await Notification.insertMany(
    superAdmins.map(sa => ({
      recipient: sa._id,
      type:      "new_contact",
      title:     `New contact message from ${name}`,
      body:      subject,
      link:      `/contact-messages/${doc._id}`,
    }))
  );

  res.status(201).json({ success: true, message: "Message received. We'll be in touch soon.", data: {} });
}

// GET /api/v1/contact  — super_admin only
exports.listMessages= async (req, res) =>  {
  const { page = 1, limit = 20, status, topic } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (topic)  filter.topic  = topic;

  const [messages, total] = await Promise.all([
    ContactMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("user", "name email avatar"),
    ContactMessage.countDocuments(filter),
  ]);

  res.json({ success: true, message: "OK", data: { messages, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) } } });
}

// GET /api/v1/contact/:id  — super_admin only
exports.getMessage = async (req, res) => {
  const doc = await ContactMessage.findById(req.params.id).populate("user", "name email avatar").populate("reply.repliedBy", "name avatar");
  if (!doc) return res.status(404).json({ success: false, message: "Message not found." });

  // Mark as read
  if (doc.status === "unread") {
    doc.status = "read";
    await doc.save();
  }

  res.json({ success: true, message: "OK", data: { message: doc } });
}

// POST /api/v1/contact/:id/reply  — super_admin only
exports.replyToMessage = async (req, res) => {
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ success: false, message: "Reply body is required." });

  const doc = await ContactMessage.findById(req.params.id);
  if (!doc) return res.status(404).json({ success: false, message: "Message not found." });

  doc.reply  = { body, repliedBy: req.user._id, repliedAt: new Date() };
  doc.status = "replied";
  await doc.save();

  // Email the user
  await sendReplyToUser({
    toName:          doc.name,
    toEmail:         doc.email,
    originalSubject: doc.subject,
    replyBody:       body,
    adminName:       req.user.name,
  });

  // In-app notification if the sender has an account
  if (doc.user) {
    await Notification.create({
      recipient: doc.user,
      sender:    req.user._id,
      type:      "contact_reply",
      title:     "We replied to your message",
      body:      doc.subject,
      link:      "/contact",
    });
  }

  res.json({ success: true, message: "Reply sent.", data: {} });
}

// PATCH /api/v1/contact/:id/archive  — super_admin only
exports.archiveMessage = async(req, res) => {
  const doc = await ContactMessage.findByIdAndUpdate(req.params.id, { status: "archived" }, { new: true });
  if (!doc) return res.status(404).json({ success: false, message: "Not found." });
  res.json({ success: true, message: "Archived.", data: {} });
}