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

const app = express();
const server = http.createServer(app);

app.set("trust proxy", 1);

// ── CORS 
// ── CORS origins ──────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.ADMIN_URL,   // http://localhost:5173
  process.env.CLIENT_URL,  // http://localhost:3000
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Authorization"],
  optionsSuccessStatus: 204,
};

// ── Preflight — MUST be before all other middleware ───────────────────────────
app.options("/{*path}", cors(corsOptions));


// ── Apply CORS to all routes ──────────────────────────────────────────────────
app.use(cors(corsOptions));
// ── Preflight (must be before other routes)
// app.options("*", cors());
// app.use(cors({ origin: "*", credentials: true }));


// ── Security (must come first, before body parsing) 
app.use(helmetMiddleware);
app.use(globalRateLimiter);
app.use(speedLimiter);

// ── Body parsers 
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// ── Compression (after body parsing, before sanitisation) 
app.use(compression());

// ── Sanitisation (FIXED — uses safe custom middleware) 
app.use(mongoSanitiseMiddleware);
app.use(hppMiddleware);

// ── Logging 
// if (process.env.NODE_ENV === "development") {
//   app.use(morgan("dev"));
// }

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev", {
    skip: (req) => req.path.startsWith("/api/v1"), // never log auth routes
  }));
}

app.use("/api/v1/uploads", require("./routes/uploadRoutes"));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/v1", router);

// ── Error handlers ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 5000;

const bootstrap = async () => {
  try {
    await connectDB();
    initQueues();
    server.listen(PORT, () => {
      logger.info(`🚀  OsunGist API running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    logger.error("Bootstrap failed:", err);
    process.exit(1);
  }
};

bootstrap();

process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
process.on("unhandledRejection", (reason) => logger.error("Unhandled rejection:", reason));
process.on("uncaughtException", (err) => { logger.error("Uncaught exception:", err); process.exit(1); });

module.exports = app;