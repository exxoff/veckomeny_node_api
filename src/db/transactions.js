const path = require("path");
const constants = require(path.resolve("src", "constants"));

module.exports.getAll = async (connection, table, pagination, searchObj) => {
  return new Promise((resolve, reject) => {
    let sql = `SELECT * FROM ${table} WHERE 1`;
    if (searchObj) {
      console.log("SearchObject:", searchObj);
      if (searchObj.name) {
        sql = `${sql} AND name like '%${searchObj.name}%'`;
      }
      if (searchObj.comment) {
        sql = `${sql} AND comment like '%${searchObj.comment}%'`;
      }
      if (searchObj.categories) {
        // console.log("Categories:", searchObj.categories);
        sql = `${sql} AND id in (SELECT recipe_id from ${constants.JOIN_TABLE} WHERE category_id IN (${searchObj.categories}) GROUP BY recipe_id HAVING COUNT(*) =${searchObj.categories.length})`;
      }
      if (searchObj.before) {
        sql = `${sql} AND date <= '${searchObj.before}'`;
      }
      if (searchObj.after) {
        sql = `${sql} AND date >= '${searchObj.after}'`;
      }
    }

    if (pagination.limit) {
      sql = `${sql} limit ${pagination.offset || 0},${pagination.limit}`;
    }
    // let n = "";
    // console.log("SQL:", sql);
    connection.query(sql, (error, result) => {
      if (error) {
        reject({
          retcode: 500,
          retmsg: {
            code: constants.E_DBERROR,
            msg: constants.E_DBERROR_MSG,
            error: error,
          },
        });
      } else if (result.length < 1) {
        resolve({
          retcode: 200,
          retmsg: {
            code: constants.E_NOTFOUND,
            msg: constants.E_NOTFOUND_MSG,
            data: [],
          },
        });
      } else {
        resolve({
          retcode: 200,
          retmsg: {
            code: constants.I_SUCCESS,
            msg: constants.I_SUCCESS_MSG,
            data: result,
          },
        });
      }
    });
  });
};

module.exports.getPost = async (connection, table, post) => {
  return new Promise(async (resolve, reject) => {
    const sql = `SELECT * FROM ${table} WHERE ?`;
    connection.query(sql, [post], (error, result) => {
      if (error) {
        reject({
          retcode: 500,
          retmsg: {
            code: constants.E_DBERROR,
            msg: constants.E_DBERROR_MSG,
            error: error.message,
          },
        });
      } else if (result.length < 1) {
        resolve({
          retcode: 404,
          retmsg: {
            code: constants.E_NOTFOUND,
            msg: constants.E_NOTFOUND_MSG,
            data: {},
          },
        });
      } else {
        resolve({
          retcode: 200,
          retmsg: {
            code: constants.I_SUCCESS,
            msg: constants.I_SUCCESS_MSG,
            data: result[0],
          },
        });
      }
    });
  });
};

module.exports.addPost = async (connection, table, post) => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO ${table} set ?`;
    connection.query(sql, [post], async (error, result) => {
      if (error) {
        console.log(error.code);
        let errCode = 500;
        let errMsg = "";
        let code = "";
        let msg = "";
        switch (error.code) {
          case "ER_DUP_ENTRY":
            errCode = 400;
            errMsg = "Entity already exist";
            code = constants.E_INVALIDDATA;
            msg = constants.E_INVALIDDATA_MSG;
            break;
          default:
            errMsg = error.message;
            code = constants.E_DBERROR;
            msg = constants.E_DBERROR_MSG;
            break;
        }
        reject({
          retcode: errCode,
          retmsg: {
            code: code,
            msg: msg,
            error: errMsg,
          },
        });
      } else {
        const d = await this.getPost(connection, table, {
          id: result.insertId,
        });

        resolve({
          retcode: 200,
          retmsg: {
            code: constants.I_SUCCESS,
            msg: constants.I_SUCCESS_MSG,
            data: d.retmsg.data,
          },
        });
      }
    });
  });
};

module.exports.updatePost = async (connection, table, id, newPost) => {
  return new Promise((resolve, reject) => {
    newPost.updated_at = {
      toSqlString: function () {
        return "CURRENT_TIMESTAMP()";
      },
    };
    const sql = `UPDATE ${table} set ? WHERE id=?`;
    connection.query(sql, [newPost, id], (error, result) => {
      if (error) {
        reject({
          retcode: 500,
          retmsg: {
            code: constants.E_DBERROR,
            msg: constants.E_DBERROR_MSG,
            error: error.message,
          },
        });
      } else {
        resolve({
          retcode: 200,
          retmsg: {
            code: constants.I_SUCCESS,
            msg: constants.I_SUCCESS_MSG,
            data: result.affectedRows,
          },
        });
      }
    });
  });
};

module.exports.deleteFromJoin = async (connection, post) => {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM ${constants.JOIN_TABLE} WHERE ?`;
    connection.query(sql, [post], async (error, result) => {
      if (error) {
        reject({
          retcode: 500,
          retmsg: {
            code: constants.E_DBERROR,
            msg: constants.E_DBERROR_MSG,
            error: error.message,
          },
        });
      } else {
        resolve({
          retcode: 200,
          retmsg: {
            code: constants.I_SUCCESS,
            msg: constants.I_SUCCESS_MSG,
            data: result.affectedRows,
          },
        });
      }
    });
  });
};

module.exports.deletePost = async (connection, table, post) => {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM ${table} WHERE ?`;
    connection.query(sql, [post], async (error, result) => {
      if (error) {
        reject({
          retcode: 500,
          retmsg: {
            code: constants.E_DBERROR,
            msg: constants.E_DBERROR_MSG,
            error: error.message,
          },
        });
      } else {
        if (result.affectedRows === 0) {
          reject({
            retcode: 404,
            retmsg: {
              code: constants.E_NOTFOUND,
              msg: constants.E_NOTFOUND_MSG,
              error: "Not found",
            },
          });
        } else {
          resolve({
            retcode: 200,
            retmsg: {
              code: constants.I_SUCCESS,
              msg: constants.I_SUCCESS_MSG,
              data: result.affectedRows,
            },
          });
        }
      }
    });
  });
};

module.exports.getCategoryRecipes = async (connection, id) => {
  return new Promise((resolve, reject) => {
    sql = `select r.id,r.created_at,r.updated_at,r.name,r.link,r.comment,r.deleted FROM ${constants.JOIN_TABLE}\
    JOIN ${constants.RECIPE_TABLE} as r ON ${constants.JOIN_TABLE}.recipe_id=r.id\
    JOIN ${constants.CATEGORY_TABLE} as c ON ${constants.JOIN_TABLE}.category_id=c.id\
    WHERE category_id=?`;
    connection.query(sql, [id], (error, result) => {
      if (error) {
        reject({
          retcode: 500,
          retmsg: {
            code: constants.E_DBERROR,
            msg: constants.E_DBERROR_MSG,
            error: error,
          },
        });
      } else {
        resolve({
          retcode: 200,
          retmsg: {
            code: constants.I_SUCCESS,
            msg: constants.I_SUCCESS_MSG,
            data: result,
          },
        });
      }
    });
  });
};

module.exports.getRecipeCategories = async (connection, id) => {
  return new Promise((resolve, reject) => {
    sql = `select c.id,c.created_at,c.updated_at,c.name FROM ${constants.JOIN_TABLE}\
    JOIN ${constants.RECIPE_TABLE} as r ON ${constants.JOIN_TABLE}.recipe_id=r.id\
    JOIN ${constants.CATEGORY_TABLE} as c ON ${constants.JOIN_TABLE}.category_id=c.id\
    WHERE recipe_id=?`;
    // console.log(sql);
    connection.query(sql, [id], (error, result) => {
      if (error) {
        reject({
          retcode: 500,
          retmsg: {
            code: constants.E_DBERROR,
            msg: constants.E_DBERROR_MSG,
            error: error,
          },
        });
      } else {
        resolve({
          retcode: 200,
          retmsg: {
            code: constants.I_SUCCESS,
            msg: constants.I_SUCCESS_MSG,
            data: result,
          },
        });
      }
    });
  });
};

module.exports.getRecipeMenus = async (connection, id) => {
  return new Promise((resolve, reject) => {
    sql = `SELECT * FROM ${constants.MENU_TABLE} WHERE recipe_id=?`;
    connection.query(sql, [id], (error, result) => {
      if (error) {
        reject({
          retcode: 500,
          retmsg: {
            code: constants.E_DBERROR,
            msg: constants.E_DBERROR_MSG,
            error: error,
          },
        });
      } else {
        resolve({
          retcode: 200,
          retmsg: {
            code: constants.I_SUCCESS,
            msg: constants.I_SUCCESS_MSG,
            data: result,
          },
        });
      }
    });
  });
};

module.exports.setRecipeCategories = async (connection, id, insertObj) => {
  return new Promise(async (resolve, reject) => {
    if (id) {
      await deleteFromJoin(connection, { recipe_id: id });
    }
    let sql = `INSERT INTO ${constants.JOIN_TABLE} (recipe_id,category_id) values ?`;
    connection.query(sql, [insertObj], (error, result) => {
      if (error) {
        reject({
          code: constants.E_DBERROR,
          msg: constants.E_DBERROR_MSG,
          error: error,
        });
      } else {
        resolve({
          code: constants.I_SUCCESS,
          msg: constants.I_SUCCESS_MSG,
          data: result,
        });
      }
    });
  });
};
