const multer = require("multer");
const path = require("path");
const { sendError } = require("../utils/apiResponse");

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
];

const ALLOWED = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED.includes(file.mimetype)) {
    return cb(
      new Error(`Unsupported file type: ${file.mimetype}`),
      false
    );
  }

  cb(null, true);
};

const sanitiseFilename = (name) => {
  const ext = path.extname(name).toLowerCase();

  const base = path
    .basename(name, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 80);

  return `${base}${ext}`;
};

const handleUpload = (uploadFn) => {
  return (req, res, next) => {
    uploadFn(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return sendError(res, "File too large.", 413);
        }

        return sendError(res, err.message, 400);
      }

      if (err) {
        return sendError(res, err.message, 400);
      }

      next();
    });
  };
};

const uploadSingleImage = handleUpload(
  multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 1,
    },
  }).single("image")
);

const uploadBlogMedia = handleUpload(
  multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 1,
    },
  }).single("featuredImage")
);

const uploadArticleMedia = handleUpload(
  multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 100 * 1024 * 1024,
    },
  }).fields([
    { name: "featuredImage", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ])
);

module.exports = {
  uploadSingleImage,
  uploadBlogMedia,
  uploadArticleMedia,
  sanitiseFilename,
};