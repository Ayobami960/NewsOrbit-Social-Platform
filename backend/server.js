require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const http = require("http");
const { initSocket } = require("./config/socket");

const env = require("./lib/env");
const connectDB = require("./config/db");
const { initQueues, shutdownScheduler } = require("./jobs/scheduler");
const logger = require("./utils/logger");

const {
  helmetMiddleware,
  mongoSanitiseMiddleware,
  hppMiddleware,
  globalRateLimiter,
  speedLimiter,
} = require("./middlewares/security");

const router = require("./routes/index");
const { errorHandler, notFound } = require("./middlewares/errorHandler");

// ─────────────────────────────────────────────
// App & Server
// ─────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// Wire socket.io AFTER app and server are created
if (!env.VERCEL) {
  initSocket(server);
}

app.set("trust proxy", 1);

// Express auto-generates ETags for every response by default, which lets
// the browser conditionally request with If-None-Match and get back a
// 304 Not Modified — serving its own stale cached body even after the
// underlying data (e.g. chat inbox) has changed. This API is fully
// dynamic, so disable that behavior entirely.
app.set("etag", false);

// ─────────────────────────────────────────────
// CORS — allow all origins
// ─────────────────────────────────────────────
app.options("*", cors({ origin: true, credentials: true }));
app.use(cors({ origin: true, credentials: true }));

// ─────────────────────────────────────────────
// Security
// ─────────────────────────────────────────────
app.use(helmetMiddleware);
app.use(globalRateLimiter);
app.use(speedLimiter);

// ─────────────────────────────────────────────
// Body Parsers
// ─────────────────────────────────────────────
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// ─────────────────────────────────────────────
// Compression & Sanitisation
// ─────────────────────────────────────────────
app.use(compression());
app.use(mongoSanitiseMiddleware);
app.use(hppMiddleware);

// ─────────────────────────────────────────────
// No-cache for all API responses
// ─────────────────────────────────────────────
// Belt-and-suspenders alongside etag:false above — explicitly tells the
// browser (and any intermediary proxy/CDN) never to cache or revalidate
// these responses, so admins always see live data, not a stale snapshot.
app.use("/api/v1", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

// ─────────────────────────────────────────────
// Logging (dev only)
// ─────────────────────────────────────────────
if (env.NODE_ENV === "development") {
  app.use(
    morgan("dev", {
      skip: (req) => !req.path.startsWith("/api/v1"),
    })
  );
}

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
app.get("/", (_req, res) =>
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
);

app.use("/api", require("./routes/schedulerRoute"));
app.use("/api/v1/uploads", require("./routes/uploadRoutes"));
app.use("/api/v1", router);

// ─────────────────────────────────────────────
// Error Handlers (must be last)
// ─────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────
const PORT = env.PORT || 8000;

const bootstrap = async () => {
  try {
    await connectDB();
    await initQueues();

    if (env.NODE_ENV !== "production") {
      server.listen(PORT, () => {
        logger.info(`🚀  Server running on port ${PORT} [${env.NODE_ENV}]`);
      });
    } else {
      logger.info(`🚀  Server ready [${env.NODE_ENV}]`);
    }
  } catch (err) {
    logger.error("Bootstrap failed:", err);
    throw err;
  }
};

bootstrap();

// ─────────────────────────────────────────────
// Process Events
// ─────────────────────────────────────────────
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  await shutdownScheduler();
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT",  () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection:", reason);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception:", err);
  process.exit(1);
});

module.exports = app;