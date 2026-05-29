
const logger = require("../utils/logger");
const env = require("../lib/env");

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || "Internal Server Error";

  if (err.name === "CastError")       { statusCode = 400; message = `Invalid ${err.path}: ${err.value}`; }
  if (err.code === 11000)             { statusCode = 409; message = `Duplicate value for ${Object.keys(err.keyValue || {})[0]}.`; }
  if (err.name === "ValidationError") { statusCode = 422; message = Object.values(err.errors).map((e) => e.message).join(", "); }
  if (err.name === "JsonWebTokenError"){ statusCode = 401; message = "Invalid token."; }
  if (err.name === "TokenExpiredError"){ statusCode = 401; message = "Token expired."; }

  if (statusCode >= 500) logger.error(`[${req.method}] ${req.originalUrl} — ${message}`, { stack: err.stack });

  res.status(statusCode).json({
    success: false, message,
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

const notFound = (req, res) =>
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });

module.exports = { errorHandler, notFound };