const { link } = require("fs");
const path = require("path");
const { getPool } = require("./mysql2");
const constants = require(path.resolve("src", "constants"));
// const { getBoolean } = require("../helpers/getBoolean");
const { getBoolean } = require(path.resolve("src/helpers", "getBoolean"));
const logger = require(path.resolve("src/helpers", "logger"))(module);

const pool = getPool();

module.exports.getAll = async (connection, table, pagination, searchObj) => {
  return new Promise((resolve, reject) => {
    let sql = `SELECT * FROM ${table} WHERE 1`;
    if (searchObj) {
      logger.debug(`Search object: ${JSON.stringify(searchObj)}`);
      if (searchObj.name) {
        sql = `${sql} AND name like '%${searchObj.name}%'`;
      }
      if (searchObj.comment) {
        sql = `${sql} AND comment like '%${searchObj.comment}%'`;
      }
      if (searchObj.categories) {
        sql = `${sql} AND id in (SELECT recipe_id from ${constants.JOIN_TABLE} WHERE category_id IN (${searchObj.categories}) GROUP BY recipe_id HAVING COUNT(*) =${searchObj.categories.length})`;
      }
      if (searchObj.before) {
        sql = `${sql} AND date <= '${searchObj.before}'`;
      }
      if (searchObj.after) {
        sql = `${sql} AND date >= '${searchObj.after}'`;
      }
      if (searchObj.date) {
        sql = `${sql} AND date = '${searchObj.date}'`;
      }
      if (searchObj.deleted) {
        sql = `${sql} AND deleted = ${getBoolean(searchObj.deleted)}`;
      }
    }

    if (pagination.limit) {
      sql = `${sql} limit ${pagination.offset || 0},${pagination.limit}`;
    }
    // let n = "";

    const query = connection.query(sql, (error, result) => {
      logger.debug(`SQL query: ${query.sql}`);
      if (error) {
        //logger.error(`Error running query: ${JSON.stringify(error)}`);
        reject({
          retcode: 500,
          retmsg: {
            code: constants.E_DBERROR,
            msg: constants.E_DBERROR_MSG,
            error: error,
          },
        });
      } else if (result.length < 1) {
        logger.debug(`${result.length} records returned from database.`);
        resolve({
          retcode: 200,
          retmsg: {
            code: constants.E_NOTFOUND,
            msg: constants.E_NOTFOUND_MSG,
            data: [],
          },
        });
      } else {
        logger.debug(`${result.length} records returned from database.`);
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
    logger.debug(`Query filter: ${JSON.stringify(post)}`);
    const sql = `SELECT * FROM ${table} WHERE ?`;
    const query = connection.query(sql, [post], (error, result) => {
      logger.debug(`SQL query: ${query.sql}`);
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
        logger.debug(`No records.`);
        resolve({
          retcode: 404,
          retmsg: {
            code: constants.E_NOTFOUND,
            msg: constants.E_NOTFOUND_MSG,
            data: {},
          },
        });
      } else {
        logger.debug(`Returned result: ${JSON.stringify(result[0])}`);
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
    const query = connection.query(sql, [post], async (error, result) => {
      logger.debug(`SQL query: ${query.sql}`);
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
    const query = connection.query(sql, [newPost, id], (error, result) => {
      logger.debug(`SQL query: ${query.sql}`);
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
    const query = connection.query(sql, [post], async (error, result) => {
      logger.debug(`SQL query: ${query.sql}`);
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
    const query = connection.query(sql, [post], async (error, result) => {
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
            retcode: 204,
            retmsg: {
              code: constants.I_SUCCESS,
              msg: constants.I_SUCCESS_MSG,
              data: {},
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
    const query = connection.query(sql, [id], (error, result) => {
      logger.debug(`SQL query: ${query.sql}`);
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
    const query = connection.query(sql, [id], (error, result) => {
      logger.debug(`SQL query: ${query.sql}`);
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

// module.exports.getRecipeMenus = async (connection, id) => {
//   return new Promise((resolve, reject) => {
//     sql = `SELECT * FROM ${constants.MENU_TABLE} WHERE recipe_id=?`;
//     connection.query(sql, [id], (error, result) => {
//       if (error) {
//         reject({
//           retcode: 500,
//           retmsg: {
//             code: constants.E_DBERROR,
//             msg: constants.E_DBERROR_MSG,
//             error: error,
//           },
//         });
//       } else {
//         resolve({
//           retcode: 200,
//           retmsg: {
//             code: constants.I_SUCCESS,
//             msg: constants.I_SUCCESS_MSG,
//             data: result,
//           },
//         });
//       }
//     });
//   });
// };

module.exports.setRecipeCategories = async (connection, id, insertObj) => {
  return new Promise(async (resolve, reject) => {
    if (id) {
      await deleteFromJoin(connection, { recipe_id: id });
    }
    let sql = `INSERT INTO ${constants.JOIN_TABLE} (recipe_id,category_id) values ?`;
    const query = connection.query(sql, [insertObj], (error, result) => {
      logger.debug(`SQL query: ${query.sql}`);
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

module.exports.getMenuRecipes = async (searchObj) => {
  logger.debug(`Entering getMenuRecipes`);

  const msql = `SELECT id,comment,date from ${constants.MENU_TABLE} WHERE ?`;
  try {
    let menu = undefined;
    const [q, f] = await pool.query(msql, [searchObj]);
    if (q.length > 0) {
      menu = q[0];
    } else {
      return {
        retcode: 200,
        retmsg: {
          code: constants.I_SUCCESS,
          msg: constants.I_SUCCESS_MSG,
          data: {},
        },
      };
    }
    let sql = `SELECT r.id,r.name,r.link,r.comment,r.deleted,r.created_at,r.updated_at FROM ${constants.MENU_RECIPE_XREF_TABLE}
    JOIN ${constants.RECIPE_TABLE} as r ON ${constants.MENU_RECIPE_XREF_TABLE}.recipe_id=r.id
    WHERE menu_id=?`;

    const [recipes, rfields] = await pool.query(sql, [menu.id]);
    menu.recipes = recipes;

    return {
      retcode: 200,
      retmsg: {
        code: constants.I_SUCCESS,
        msg: constants.I_SUCCESS_MSG,
        data: menu,
      },
    };
  } catch (error) {
    logger.debug("Aw shucks!");
    throw error;
    // return {
    //   retcode: 500,
    //   retmsg: {
    //     code: constants.E_DBERROR,
    //     msg: constants.E_DBERROR_MSG,
    //     error: error,
    //   },
    // };
  }
};

module.exports.getRecipeMenus = async (connection, id) => {
  logger.debug(`Entering getRecipeMenus`);
  return new Promise((resolve, reject) => {
    sql = `select m.id,m.created_at,m.updated_at,m.date FROM ${constants.MENU_RECIPE_XREF_TABLE}\
    JOIN ${constants.RECIPE_TABLE} as r ON ${constants.MENU_RECIPE_XREF_TABLE}.recipe_id=r.id\
    JOIN ${constants.MENU_TABLE} as m ON ${constants.MENU_RECIPE_XREF_TABLE}.menu_id=m.id\
    WHERE recipe_id=?`;
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

module.exports.setMenuRecipesXref = async (connection, insertObj) => {
  logger.debug(`Entering setMenuRecipesXref`);
  return new Promise(async (resolve, reject) => {
    let sql = `INSERT INTO ${constants.MENU_RECIPE_XREF_TABLE} (menu_id,recipe_id) values ?`;
    const t = insertObj.map((r) => new Array(r.menu_id, r.recipe_id));

    // let sql = `INSERT INTO ${constants.MENU_RECIPE_XREF_TABLE} (menu_id,recipe_id) values ?`;
    connection.query(sql, [t], (error, result) => {
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

module.exports.deleteFromMenuRecipeXref = async (
  connection,
  menuId,
  recipeId
) => {
  logger.debug(`Entering deleteFromMenuRecipeXref`);
  return new Promise(async (resolve, reject) => {
    let sql = `DELETE FROM ${constants.MENU_RECIPE_XREF_TABLE} WHERE ? AND ?`;
    const query = connection.query(sql, [menuId, recipeId], (error, result) => {
      logger.debug(`SQL query: ${query.sql}`);
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
          data: {},
        });
      }
    });
  });
};

// Delete a menu

// Remove a recipe from a Menu
