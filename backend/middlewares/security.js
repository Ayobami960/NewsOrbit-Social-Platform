
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const rateLimit  = require("express-rate-limit");
const slowDown = require("express-slow-down");
const env = require("../lib/env");
const { log } = require("../models/ActivityLog");

const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", "data:", "https://ik.imagekit.io"],
      connectSrc: ["'self'"],
      frameSrc:   ["'none'"],
      objectSrc:  ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});


const mongoSanitiseMiddleware = (req, res, next) => {
  try {
    const opts = { replaceWith: "_", allowDots: true };

    if (req.body)   req.body   = mongoSanitize.sanitize(req.body,         opts);
    if (req.params) req.params = mongoSanitize.sanitize(req.params,       opts);

    // req.query is READ-ONLY in Node 18+ — copy, sanitize, then redefine
    if (req.query) {
      const clean = mongoSanitize.sanitize({ ...req.query }, opts);
      Object.defineProperty(req, "query", {
        value: clean,
        writable: true,
        configurable: true,
      });
    }
  } catch (e) {
    log({
      user: req.user?._id,
      action: "injection_attempt",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      severity: "critical",
      isSuspicious: true,
    });
  }
  next();
};

const hppMiddleware = hpp({ whitelist: ["tags","category","status","sort","fields"] });

const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max:      env.RATE_LIMIT_MAX,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
  handler: (req, res, next, options) => {
    log({ user: req.user?._id, action: "rate_limit_hit", ip: req.ip,
          resource: req.originalUrl, severity: "warning", isSuspicious: true });
    res.status(429).json(options.message);
  },
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { success: false, message: "Too many auth attempts. Try again in 15 minutes." },
  skipSuccessfulRequests: true,
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, delayAfter: 50,
  delayMs: (hits) => hits * 100,
});

module.exports = {
  helmetMiddleware, mongoSanitiseMiddleware,
  hppMiddleware, globalRateLimiter, authRateLimiter, speedLimiter,
};