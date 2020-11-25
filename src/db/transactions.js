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
          retcode: 200,
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
        reject({
          retcode: 500,
          retmsg: {
            code: constants.E_DBERROR,
            msg: constants.E_DBERROR_MSG,
            error: error.message,
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
