
const jwt    = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../lib/env");

const generateAccessToken  = (userId, role) =>
  jwt.sign({ id: userId, role }, env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN, algorithm: "HS256" });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN, algorithm: "HS256" });

const verifyAccessToken  = (t) => jwt.verify(t, env.JWT_SECRET);
const verifyRefreshToken = (t) => jwt.verify(t, env.JWT_REFRESH_SECRET);

const generateSecureToken = () => crypto.randomBytes(32).toString("hex");
const hashToken = (t) => crypto.createHash("sha256").update(t).digest("hex");

module.exports = {
  generateAccessToken, generateRefreshToken,
  verifyAccessToken, verifyRefreshToken,
  generateSecureToken, hashToken,
};