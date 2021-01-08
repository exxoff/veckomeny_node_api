//require("dotenv").config();
const path = require("path");
const constants = require(path.resolve("src", "constants"));
const mysql = require("mysql2/promise");
const logger = require("../helpers/logger")(module);

// DB SETUP
const DB_PORT = process.env.DB_PORT || 3306;
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_NAME = process.env.DB_NAME;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PW = process.env.DB_PW;

const connectObj = {
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USERNAME,
  password: DB_PW,
  database: DB_NAME,
  namedPlaceholders: true,
};
// This is for logging only, filter out the password
({ password, ...rest } = connectObj);

let pool = undefined;

module.exports.getPool = () => {
  if (!pool) {
    logger.debug("Connection pool doesn't exist, creating...");
    pool = mysql.createPool(connectObj);
  }

  logger.debug("Connection pool created, returning it.");

  return pool;
};
// DB CONNECT
