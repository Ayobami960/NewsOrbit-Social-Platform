

const { uploadToImageKit, deleteFromImageKit, getImageKitAuthParams } = require("../config/Imagekit");
const { sanitiseFilename } = require("../middlewares/upload");
const { log } = require("../models/ActivityLog");
const { sendSuccess, sendCreated, sendError, sendNotFound } = require("../utils/apiResponse");

exports.uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, "No file provided.", 400);
    const folder = (req.body.folder || "/uploads").replace(/[^a-zA-Z0-9_\-/]/g, "").slice(0,100);
    const tags   = req.body.tags ? req.body.tags.split(",").map(t=>t.trim().slice(0,50)).slice(0,10) : [];
    const name   = sanitiseFilename(req.file.originalname);
    const uploaded = await uploadToImageKit(req.file.buffer, name, folder, tags);
    log({ user:req.user._id, action:"media_upload", resource:uploaded.fileId, ip:req.ip });
    return sendCreated(res, { media:uploaded }, "Uploaded.");
  } catch (err) { next(err); }
};

exports.deleteMedia = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    if (!/^[a-zA-Z0-9_\-]{5,100}$/.test(fileId)) return sendError(res, "Invalid file ID.", 400);
    await deleteFromImageKit(fileId);
    log({ user:req.user._id, action:"media_delete", resource:fileId, ip:req.ip });
    return sendSuccess(res, {}, "File deleted.");
  } catch (err) {
    if (err.message?.includes("404")) return sendNotFound(res, "File not found.");
    next(err);
  }
};

exports.getUploadAuth = (req, res) => {
  const params = getImageKitAuthParams();
  return sendSuccess(res, { auth:params });
};