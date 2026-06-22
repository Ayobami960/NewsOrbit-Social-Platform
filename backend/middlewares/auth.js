const mongoose = require("mongoose");
const { verifyAccessToken } = require("../utils/tokens");
const User = require("../models/User");
const { sendUnauthorized, sendForbidden } = require("../utils/apiResponse");
const { log } = require("../models/ActivityLog");

function extractBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

const protect = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);
    if (!token) return sendUnauthorized(res, "No token provided.");

    const decoded = verifyAccessToken(token);

    if (!mongoose.isValidObjectId(decoded.id)) {
      return sendUnauthorized(res, "Invalid token.");
    }

    const user = await User.findById(decoded.id).select(
      "+isActive +isBanned +role +passwordChangedAt"
    );
    if (!user) return sendUnauthorized(res, "User no longer exists.");
    if (!user.isActive) return sendUnauthorized(res, "Account deactivated.");
    if (user.isBanned) return sendForbidden(res, "Account suspended. Contact support.");

    // Invalidate tokens issued before a password change / forced logout
    if (user.passwordChangedAt && decoded.iat) {
      const changedAtSeconds = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedAtSeconds) {
        return sendUnauthorized(res, "Session expired, please log in again.");
      }
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") return sendUnauthorized(res, "Token expired.");
    if (err.name === "JsonWebTokenError") return sendUnauthorized(res, "Invalid token.");
    if (err.name === "CastError") return sendUnauthorized(res, "Invalid token.");
    next(err);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);
    if (token) {
      const decoded = verifyAccessToken(token);
      if (mongoose.isValidObjectId(decoded.id)) {
        const user = await User.findById(decoded.id).select(
          "+isActive +isBanned +passwordChangedAt"
        );
        if (user && user.isActive && !user.isBanned) {
          if (
            !user.passwordChangedAt ||
            !decoded.iat ||
            decoded.iat >= Math.floor(user.passwordChangedAt.getTime() / 1000)
          ) {
            req.user = user;
          }
        }
      }
    }
  } catch (err) {
    // Only swallow expected auth failures; surface real errors
    if (err.name !== "TokenExpiredError" && err.name !== "JsonWebTokenError") {
      req.log?.error?.(err) ?? console.error("optionalAuth error:", err);
    }
  }
  next();
};

const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    log({
      user: req.user?._id,
      action: "forbidden_access",
      ip: req.ip,
      resource: req.originalUrl,
      severity: "warning",
      isSuspicious: true,
    });
    return sendForbidden(res, "You do not have permission for this action.");
  }
  next();
};

module.exports = { protect, optionalAuth, restrictTo };