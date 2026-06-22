// backend/routes/chat.routes.js
const express = require("express");
const { protect } = require("../middlewares/auth");
const {
  getMyConversation,
  getMyMessages,
  markMyRead,
  listInbox,
  getInboxMessages,
  markInboxRead,
  assignConversation,
  closeConversation,
} = require("../controllers/chat.controller");

const router = express.Router();
router.use(protect);

// ── User routes ──────────────────────────────────────────────────────────────
router.get("/my", getMyConversation); 
router.get("/my/messages", getMyMessages);    
router.patch("/my/read", markMyRead);       

// ── Support (admin/super_admin) routes ───────────────────────────────────────
router.get("/inbox", listInbox);        
router.get("/inbox/:conversationId/messages", getInboxMessages);   
router.patch("/inbox/:conversationId/read", markInboxRead);     
router.patch("/inbox/:conversationId/assign", assignConversation);  
router.patch("/inbox/:conversationId/close", closeConversation);   

module.exports = router;
