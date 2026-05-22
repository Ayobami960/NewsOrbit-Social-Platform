

const { verifyAccessToken } = require("../utils/tokens");
const User = require("../models/User");
const { sendUnauthorized, sendForbidden } = require("../utils/apiResponse");
const { log } = require("../models/ActivityLog");

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;
    if (!token) return sendUnauthorized(res, "No token provided.");

    const decoded = verifyAccessToken(token);
    const user    = await User.findById(decoded.id).select("+isActive +isBanned +role");
    if (!user)         return sendUnauthorized(res, "User no longer exists.");
    if (!user.isActive)return sendUnauthorized(res, "Account deactivated.");
    if (user.isBanned) return sendForbidden(res, `Account banned: ${user.banReason}`);

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") return sendUnauthorized(res, "Token expired.");
    if (err.name === "JsonWebTokenError")  return sendUnauthorized(res, "Invalid token.");
    next(err);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      const decoded = verifyAccessToken(token);
      const user    = await User.findById(decoded.id);
      if (user && user.isActive && !user.isBanned) req.user = user;
    }
  } catch (_) {}
  next();
};

const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    log({ user: req.user?._id, action: "forbidden_access", ip: req.ip,
          resource: req.originalUrl, severity: "warning", isSuspicious: true });
    return sendForbidden(res, "You do not have permission for this action.");
  }
  next();
};

module.exports = { protect, optionalAuth, restrictTo };