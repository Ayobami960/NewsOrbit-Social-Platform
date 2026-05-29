const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, colorize, errors } = format;

const devFormat = printf(({ level, message, timestamp, stack }) =>
  `${timestamp} [${level}]: ${stack || message}`
);

const isVercel = !!process.env.VERCEL;

const loggerTransports = [new transports.Console()];

if (!isVercel) {
  const fs = require("fs");
  if (!fs.existsSync("logs")) {
    fs.mkdirSync("logs", { recursive: true });
  }
  loggerTransports.push(
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" })
  );
}

const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    process.env.NODE_ENV !== "production"
      ? combine(colorize(), devFormat)
      : format.json()
  ),
  transports: loggerTransports,
});

module.exports = logger;