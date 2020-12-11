require("dotenv").config();
const path = require("path");
const winston = require("winston");

const getLabel = (callingModule) => {
  const parts = callingModule.filename.split(path.sep);
  return path.join(parts[parts.length - 2], parts.pop());
};

const logFormat = winston.format.printf(
  (info) => `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`
);

const logger = (callingModule) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.label({ label: getLabel(callingModule) }),
      winston.format.metadata({
        fillExcept: ["message", "level", "timestamp", "label"],
      })
    ),

    transports: [
      new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), logFormat),
      }),
    ],
  });
};
module.exports = logger;
