//require("dotenv").config();
const path = require("path");
const constants = require(path.resolve("src", "constants"));
const mysql = require("mysql");

// DB SETUP
const DB_PORT = process.env.DB_PORT || 3306;
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_NAME = process.env.DB_NAME;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PW = process.env.DB_PW;

module.exports.establishConnection = () => {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USERNAME,
      password: DB_PW,
      database: DB_NAME,
    });
    connection.connect((err) => {
      if (err) {
        // console.log("Connection error");

        reject({
          retcode: 500,
          retmsg: {
            code: constants.E_DBERROR,
            msg: constants.E_DBERROR_MSG,
            error: err.message,
          },
        });
        return;
      }
      // console.log("Connection established");
      resolve(connection);
    });
  });
};

module.exports.disconnect = (con) => {
  con.end();
  // console.log("Connection ended");
};
// DB CONNECT
