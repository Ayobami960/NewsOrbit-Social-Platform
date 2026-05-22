// // // // routes/upload.routes.js
// // // const router = require("express").Router();
// // // const { protect }             = require("../middlewares/auth");
// // // const uploadCtrl              = require("../controllers/upload.controller");
// // // const { getImageKitAuthParams } = require("../config/Imagekit");

// // // // ─────────────────────────────────────────────────────────────────────────────
// // // // GET /api/v1/uploads/imagekit-auth
// // // //
// // // // Returns signed auth params so the frontend can upload directly to ImageKit.
// // // //
// // // // FIX: Must return the standard ApiResponse shape:
// // // //   { success: true, message: "...", data: { token, expire, signature, publicKey, urlEndpoint } }
// // // //
// // // // The frontend's authFetch unwraps ONE level to get authRes.data, so:
// // // //   authRes.data.token      ← must work
// // // //   authRes.data.publicKey  ← must work
// // // // ─────────────────────────────────────────────────────────────────────────────
// // // router.get("/imagekit-auth", protect, (req, res, next) => {
// // //   try {
// // //     const auth = getImageKitAuthParams();

// // //     // Standard ApiResponse wrapper — authFetch on the frontend gives the caller
// // //     // authRes.data, which will be the object below.
// // //     res.json({
// // //       success: true,
// // //       message: "Auth params generated.",
// // //       data: {
// // //         token:       auth.token,
// // //         expire:      Number(auth.expire),
// // //         signature:   auth.signature,
// // //         publicKey:   auth.publicKey,
// // //         urlEndpoint: auth.urlEndpoint,
// // //       },
// // //     });
// // //   } catch (err) {
// // //     next(err);
// // //   }
// // // });

// // // // ─────────────────────────────────────────────────────────────────────────────
// // // // POST /api/v1/uploads  — server-side fallback (multer buffer → ImageKit)
// // // // ─────────────────────────────────────────────────────────────────────────────
// // // router.post("/", protect, uploadCtrl.uploadImage);

// // // // ─────────────────────────────────────────────────────────────────────────────
// // // // DELETE /api/v1/uploads  — remove a file from ImageKit by fileId
// // // // ─────────────────────────────────────────────────────────────────────────────
// // // router.delete("/", protect, uploadCtrl.deleteImage);

// // // module.exports = router;


// // // routes/uploadRoutes.js
// // //
// // // IMPORTANT: This file MUST be named uploadRoutes.js (not upload.routes.js)
// // // because server.js mounts it as:
// // //   app.use("/api/v1/uploads", require("./routes/uploadRoutes"));
// // //
// // const router = require("express").Router();
// // const { protect }               = require("../middlewares/auth");
// // const uploadCtrl                = require("../controllers/upload.controller");
// // const { getImageKitAuthParams } = require("../config/Imagekit");

// // // ─────────────────────────────────────────────────────────────────────────────
// // // GET /api/v1/uploads/imagekit-auth
// // //
// // // Returns signed auth params so the browser can upload directly to ImageKit.
// // //
// // // Response shape (standard ApiResponse):
// // // {
// // //   success: true,
// // //   message: "Auth params generated.",
// // //   data: {
// // //     token:       string,   ← HMAC-signed UUID
// // //     expire:      number,   ← Unix timestamp (seconds)
// // //     signature:   string,   ← HMAC-SHA1 hex
// // //     publicKey:   string,   ← IMAGEKIT_PUBLIC_KEY
// // //     urlEndpoint: string,   ← IMAGEKIT_URL_ENDPOINT
// // //   }
// // // }
// // //
// // // The frontend's authFetch unwraps one level, so the caller gets:
// // //   authRes.data.token, authRes.data.publicKey, etc.
// // // ─────────────────────────────────────────────────────────────────────────────
// // router.get("/imagekit-auth", protect, (req, res, next) => {
// //   try {
// //     const auth = getImageKitAuthParams();

// //     return res.json({
// //       success: true,
// //       message: "Auth params generated.",
// //       data: {
// //         token:       auth.token,
// //         expire:      Number(auth.expire),
// //         signature:   auth.signature,
// //         publicKey:   auth.publicKey,
// //         urlEndpoint: auth.urlEndpoint,
// //       },
// //     });
// //   } catch (err) {
// //     next(err);
// //   }
// // });

// // // ─────────────────────────────────────────────────────────────────────────────
// // // POST /api/v1/uploads  — server-side fallback (multer buffer → ImageKit)
// // // ─────────────────────────────────────────────────────────────────────────────
// // router.post("/", protect, uploadCtrl.uploadImage);

// // // ─────────────────────────────────────────────────────────────────────────────
// // // DELETE /api/v1/uploads  — remove a file from ImageKit by fileId
// // // ─────────────────────────────────────────────────────────────────────────────
// // router.delete("/", protect, uploadCtrl.deleteImage);

// // module.exports = router;



// // routes/uploadRoutes.js
// //
// // Mounted in server.js as:
// //   app.use("/api/v1/uploads", require("./routes/uploadRoutes"));
// //
// // File MUST be named uploadRoutes.js — that's what server.js requires.
// //
// const router = require("express").Router();
// const { protect }  = require("../middlewares/auth");
// const uploadCtrl = require("../controllers/upload.controller");

// router.get("/imagekit/auth", protect, uploadCtrl.getImageKitAuth);
// // ─────────────────────────────────────────────────────────────────────────────
// // GET /api/v1/uploads/imagekit-auth
// //
// // Mirrors the doc-22 pattern:
// //   const auth = client.helper.getAuthenticationParameters();
// //   res.json({ ...auth, publicKey, urlEndpoint });
// //
// // But wrapped in the standard ApiResponse so authFetch works:
// //   authRes.data.token, authRes.data.publicKey, etc.
// // ─────────────────────────────────────────────────────────────────────────────
// // getImageKitAuth
// // // POST /api/v1/uploads  — server-side fallback (multer → ImageKit)
// // router.post("/", protect, uploadCtrl.uploadImage);

// // // DELETE /api/v1/uploads  — delete by fileId
// // router.delete("/", protect, uploadCtrl.deleteImage);

// module.exports = router;


const router = require("express").Router();
const { protect } = require("../middlewares/auth");
const uploadCtrl = require("../controllers/upload.controller");

router.get("/imagekit/auth", protect, (req, res, next) => {
  console.log("✅ imagekit/auth hit");
  next();
}, uploadCtrl.getImageKitAuth);



module.exports = router;