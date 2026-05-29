// const Redis = require("ioredis");
// const logger = require("../utils/logger");

// let redisClient = null;

// const connectRedis = () => {
//   redisClient = new Redis({
//     host: process.env.REDIS_HOST || "127.0.0.1",
//     port: parseInt(process.env.REDIS_PORT) || 6379,
//     password: process.env.REDIS_PASSWORD || undefined,
//     retryStrategy: (times) => Math.min(times * 50, 2000),
//     maxRetriesPerRequest: 3,
//     enableReadyCheck: true,
//     lazyConnect: false,
//   });

//   redisClient.on("connect", () => logger.info("Redis connected"));
//   redisClient.on("error", (err) => logger.error(`Redis error: ${err.message}`));
//   redisClient.on("close", () => logger.warn("Redis connection closed"));

//   return redisClient;
// };

// const getRedis = () => {
//   if (!redisClient) throw new Error("Redis not initialised. Call connectRedis() first.");
//   return redisClient;
// };

// module.exports = { connectRedis, getRedis };