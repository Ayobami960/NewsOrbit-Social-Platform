
const ImageKit = require("@imagekit/nodejs");
const path = require("path");
const env = require("./env");

const client = new ImageKit({
  publicKey: env.IMAGEKIT_PUBLIC_KEY,
  privateKey: env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,

  timeout: 45000,
});

const uploadToImageKit = async (file, options = {}) => {
  if (!file?.buffer) {
    throw new Error("Invalid file object. Ensure Multer is using memoryStorage().");
  }

  const { folder = "/uploads", fileNamePrefix = "file", tags = [], alt = "", caption = "" } = options;
  const extension = file.originalname ? path.extname(file.originalname) : ".jpg";
  const fileName = `${fileNamePrefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}${extension}`;

  // ✅ FIX: Convert Buffer to base64 string
  const base64File = file.buffer.toString("base64");

  const result = await client.files.upload({
    file: base64File,        // ← base64 string, not raw Buffer
    fileName,
    folder,
    useUniqueFileName: true,
    tags,
  });

  return {
    url: result.url,
    fileId: result.fileId,
    fileType: result.fileType || "image",
    alt,
    caption,
    width: result.width,
    height: result.height,
    size: result.size,
    thumbnailUrl: result.thumbnailUrl,
  };
};

const deleteFromImageKit = async (fileId) => {
  if (!fileId) return;
  try {
    // 🔴 FIX: Changed client.deleteFile to client.files.delete
    await client.files.delete(fileId);
  } catch (err) {
    console.warn(`[ImageKit] Failed to delete file ${fileId}:`, err.message);
  }
};

module.exports = { uploadToImageKit, deleteFromImageKit, client };