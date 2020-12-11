//require("dotenv").config();
const path = require("path");
const constants = require(path.resolve("src", "constants"));
const mysql = require("mysql");
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
};
// This is for logging only, filter out the password
({ password, ...rest } = connectObj);

module.exports.establishConnection = () => {
  return new Promise((resolve, reject) => {
    logger.debug(`Connecting to database. DB CONFIG: ${JSON.stringify(rest)}`);
    const connection = mysql.createConnection(connectObj);
    connection.connect((err) => {
      if (err) {
        // console.log("Connection error");
        // logger.error(`Error connecting to database: ${err.message}`);
        reject(err);
        // reject({
        //   retcode: 500,
        //   retmsg: {
        //     code: constants.E_DBERROR,
        //     msg: constants.E_DBERROR_MSG,
        //     error: err.message,
        //   },
        // });
        return;
      }
      logger.debug(`Connection to database established.`);
      resolve(connection);
    });
  });
};

module.exports.disconnect = (con) => {
  con.end();
  logger.debug(`Connection ended.`);
};
// DB CONNECT
