
const ImageKit = require("@imagekit/nodejs");
const env = require("../lib/env");

/** deletes an ImageKit file by `fileId` */
async function deleteImageKitAsset(storedFileId) {
  if (!storedFileId) return;

  const client = new ImageKit({ privateKey: env.IMAGEKIT_PRIVATE_KEY });

  try {
    await client.files.delete(storedFileId);
  } catch (e) {
    if (e.name === "NotFoundError" || e.message?.includes("NotFound")) {
      return;
    }
    throw e;
  }
}

module.exports = { deleteImageKitAsset };