
const jwt    = require("jsonwebtoken");
const crypto = require("crypto");

const generateAccessToken  = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "3h", algorithm: "HS256" });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d", algorithm: "HS256" });

const verifyAccessToken  = (t) => jwt.verify(t, process.env.JWT_SECRET);
const verifyRefreshToken = (t) => jwt.verify(t, process.env.JWT_REFRESH_SECRET);

const generateSecureToken = () => crypto.randomBytes(32).toString("hex");
const hashToken = (t) => crypto.createHash("sha256").update(t).digest("hex");

module.exports = {
  generateAccessToken, generateRefreshToken,
  verifyAccessToken, verifyRefreshToken,
  generateSecureToken, hashToken,
};