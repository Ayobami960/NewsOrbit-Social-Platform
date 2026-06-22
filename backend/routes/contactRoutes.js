const express = require("express");
const { protect, restrictTo } = require("../middlewares/auth");

const {
  submitContact,
  listMessages,
  getMessage,
  replyToMessage,
  archiveMessage,
} = require("../controllers/contact.controller");


const router = express.Router();

router.post("/",submitContact);                       
router.get("/", protect, restrictTo("super_admin", "manager"), listMessages);
router.get("/:id", protect, restrictTo("super_admin", "manager"), getMessage);
router.post("/:id/reply",  protect, restrictTo("super_admin","manager"), replyToMessage);
router.patch("/:id/archive", protect, restrictTo("super_admin", "manager"), archiveMessage);

module.exports = router;