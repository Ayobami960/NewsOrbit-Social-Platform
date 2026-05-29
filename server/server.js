require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const http = require("http");

const connectDB = require("./config/db");
const { initQueues } = require("./jobs/scheduler");
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

app.set("trust proxy", 1);

// ─────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────
const allowedOrigins = [
  process.env.ADMIN_URL,
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server requests (no origin) or whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Authorization"],
  optionsSuccessStatus: 204,
};

// Preflight — must be registered before all other middleware
app.options("/{*path}", cors(corsOptions));
app.use(cors(corsOptions));

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
// Logging (dev only — logs API routes only)
// ─────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(
    morgan("dev", {
      skip: (req) => !req.path.startsWith("/api/v1"), // ✅ fixed: log only API routes
    })
  );
}

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
);

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
const PORT = parseInt(process.env.PORT, 10) || 8000;

const bootstrap = async () => {
  try {
    await connectDB();
    initQueues();

    if (process.env.NODE_ENV !== "production") {
      server.listen(PORT, () => {
        logger.info(`🚀  Server running on port ${PORT} [${process.env.NODE_ENV}]`);
      });
    } else {
      logger.info(`🚀  Server ready [${process.env.NODE_ENV}]`);
    }
  } catch (err) {
    logger.error("Bootstrap failed:", err);
    process.exit(1);
  }
};

bootstrap();

// ─────────────────────────────────────────────
// Process Events
// ─────────────────────────────────────────────
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
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