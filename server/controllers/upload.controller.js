
const { client } = require("../lib/upload");
const env = require("../lib/env");
const { sendSuccess, sendError } = require("../utils/apiResponse");

/**
 * GET /api/v1/uploads/imagekit/auth
 *
 * Returns short-lived ImageKit auth params for direct browser → CDN uploads.
 * Wrapped in sendSuccess() so the frontend reads fields from authRes.data.
 */
exports.getImageKitAuth = (req, res, next) => {
  try {
    // Validate env vars are present before trying to sign
    if (!env.IMAGEKIT_PRIVATE_KEY || !env.IMAGEKIT_PUBLIC_KEY || !env.IMAGEKIT_URL_ENDPOINT) {
      console.error("[ImageKit auth] Missing env vars:", {
        hasPrivateKey:   Boolean(env.IMAGEKIT_PRIVATE_KEY),
        hasPublicKey:    Boolean(env.IMAGEKIT_PUBLIC_KEY),
        hasUrlEndpoint:  Boolean(env.IMAGEKIT_URL_ENDPOINT),
      });
      return sendError(res, "ImageKit is not configured on the server.", 500);
    }

    const auth = client.helper.getAuthenticationParameters();

    // Validate the result before sending — an empty signature means the private key is wrong
    if (!auth?.token || !auth?.signature || !auth?.expire) {
      console.error("[ImageKit auth] getAuthenticationParameters returned invalid data:", auth);
      return sendError(res, "Failed to generate ImageKit auth params.", 500);
    }

    // Log in dev so you can verify the fields look right
    if (process.env.NODE_ENV !== "production") {
      console.log("[ImageKit auth] Generated auth params:", {
        token:       auth.token.slice(0, 12) + "…",
        expire:      auth.expire,
        signature:   auth.signature.slice(0, 12) + "…",
        publicKey:   env.IMAGEKIT_PUBLIC_KEY.slice(0, 12) + "…",
        urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
      });
    }

    return sendSuccess(res, {
      token:       auth.token,
      expire:      auth.expire,
      signature:   auth.signature,
      publicKey:   env.IMAGEKIT_PUBLIC_KEY,
      urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
    });
  } catch (e) {
    console.error("[ImageKit auth] Exception:", e.message);
    next(e);
  }
};