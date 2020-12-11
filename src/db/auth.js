const path = require("path");
const { establishConnection, disconnect } = require("./MysqlDb");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const constants = require(path.resolve("src", "constants"));

module.exports.validateUser = async (username, password) => {
  return new Promise(async (resolve, reject) => {
    let db = undefined;
    try {
      db = await establishConnection();
      const sql = `SELECT username,password from ${constants.USERS_TABLE} WHERE username=?`;
      db.query(sql, [username], async (error, result) => {
        if (error) {
          reject({
            retcode: 500,
            retmsg: {
              code: error.code,
              msg: error.message,
              data: {},
            },
          });
        } else {
          // console.log(result[0].password);
          if (result.length < 1) {
            reject({
              retcode: 200,
              retmsg: {
                code: constants.E_USER_NOT_FOUND,
                msg: constants.E_USER_NOT_FOUND_MSG,
                data: {},
              },
            });
            return;
          }
          const validated = await bcrypt.compare(password, result[0].password);
          if (validated) {
            const token = jwt.sign(
              { username: result[0].username },
              process.env.JWT_SECRET,
              { expiresIn: "7d" }
            );
            resolve(token);
          } else {
            reject({
              retcode: 200,
              retmsg: {
                code: constants.E_USER_AUTH_FAILED,
                msg: constants.E_USER_AUTH_FAILED_MSG,
                data: {},
              },
            });
          }
        }
      });
    } catch (error) {
      console.log("Rejected!");
      reject(error);
    } finally {
      if (db) {
        disconnect(db);
      }
    }
  });
};

module.exports.validateApiKey = async (apikey) => {
  return new Promise(async (resolve, reject) => {
    let db = undefined;
    try {
      db = await establishConnection();
      // console.log("API Key is", apikey);
      const sql = `SELECT id from ${constants.KEYS_TABLE} WHERE revoked=0 AND apikey=?`;

      db.query(sql, [apikey.toString()], async (error, result) => {
        if (error) {
          reject(error);
        } else {
          // console.log(result);
          if (result.length > 0) {
            const validated = result[0].id;

            resolve(validated);
          } else {
            reject({
              retcode: 403,
              retmsg: {
                code: constants.E_USER_AUTH_FAILED,
                msg: constants.E_USER_AUTH_FAILED_MSG,
                error: "Forbidden",
              },
            });
          }
        }
      });
    } catch (error) {
      // reject(error);
      reject({
        retcode: 500,
        retmsg: {
          code: constants.E_DBERROR,
          msg: constants.E_DBERROR_MSG,
          error: error,
        },
      });
    } finally {
      if (db) {
        disconnect(db);
      }
    }
  });
};

// module.exports.addUser = (username, password, name, admin) => {
//   return new Promise(async (resolve, reject) => {
//     let db = undefined;
//     try {
//       const hash = await bcrypt.hash(password, 10);
//       console.log(hash);

//       db = await establishConnection();
//       const sql = `INSERT INTO ${constants.USERS_TABLE} SET ?`;
//       db.query(
//         sql,
//         { username, password: hash, name, admin },
//         (error, result) => {
//           if (error) {
//             reject(error);
//           } else {
//             resolve(result);
//           }
//         }
//       );
//     } catch (error) {
//       console.log("Rejected!");
//       reject(error);
//     } finally {
//       if (db) {
//         disconnect(db);
//       }
//     }
//   });
// };

// module.exports.getAllUsers = async () => {
//   return new Promise(async (resolve, reject) => {
//     let db = undefined;
//     try {
//       db = await establishConnection();
//       const sql = `SELECT id,name,username,admin,created_at,updated_at FROM ${constants.USERS_TABLE}`;
//       db.query(sql, async (error, result) => {
//         if (error) {
//           reject(error);
//         } else {
//           resolve(result);
//         }
//       });
//     } catch (error) {
//       reject(error);
//     } finally {
//       disconnect(db);
//     }
//   });
// };

// module.exports.updateUser = async (user, id) => {
//   user.updated_at = {
//     toSqlString: function () {
//       return "CURRENT_TIMESTAMP()";
//     },
//   };
//   return new Promise(async (resolve, reject) => {
//     let db = undefined;
//     try {
//       db = await establishConnection();
//       const sql = `UPDATE ${constants.USERS_TABLE} set ? WHERE id=?`;

//       db.query(sql, [user, id], async (error, result) => {
//         if (error) {
//           reject(error);
//         } else {
//           resolve({
//             code: constants.I_SUCCESS,
//             msg: constants.I_SUCCESS_MSG,
//             data: result.affectedRows,
//           });
//         }
//       });
//     } catch (error) {
//       reject(error);
//     } finally {
//       disconnect(db);
//     }
//   });
// };
