const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT) || 5000,
  CLIENT_URL: process.env.CLIENT_URL,
  ADMIN_URL: process.env.ADMIN_URL,

  // Database
  MONGO_URI: process.env.MONGO_URI,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "3h",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  // ImageKit
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT,

  // Email
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT),
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM,
  SMTP_FROM: process.env.SMTP_FROM,           // ✅ added
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL, // ✅ added

  // Resend
  RESEND_API_KEY: process.env.RESEND_API_KEY,

  // Web Push (VAPID)
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  VAPID_EMAIL: process.env.VAPID_EMAIL,

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,

  // Redis (optional, for BullMQ scheduler)
  REDIS_HOST: process.env.REDIS_HOST || undefined,
  REDIS_PORT: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_TLS: process.env.REDIS_TLS === "true",

  // Cron
  CRON_SECRET: process.env.CRON_SECRET,

  // Deployment
  VERCEL: !!process.env.VERCEL,
};

// ====================== VALIDATION ======================
const requiredKeys = [
  "MONGO_URI",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "IMAGEKIT_PUBLIC_KEY",
  "IMAGEKIT_PRIVATE_KEY",
  "IMAGEKIT_URL_ENDPOINT",
  "SUPER_ADMIN_EMAIL", // ✅ added — needed for admin bootstrapping
];

for (const key of requiredKeys) {
  if (!env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// Optional but recommended validation
if (env.NODE_ENV === "production") {
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    console.warn("⚠️  JWT_SECRET should be at least 32 characters in production!");
  }
  if (env.RESEND_API_KEY?.startsWith("re_YOUR")) {
    console.warn("⚠️  RESEND_API_KEY looks like a placeholder — emails won't send!");
  }
}

console.log(`✅ Environment loaded successfully (${env.NODE_ENV} mode)`);

module.exports = env;