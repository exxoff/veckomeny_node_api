const path = require("path");
const constants = require(path.resolve("src", "constants"));
const { deleteFromJoin } = require("./transactions");

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

module.exports.searchRecipes = async (connection, searchObj) => {
  return new Promise(async (resolve, reject) => {
    let { name, categories } = searchObj;

    // if (id) {
    //   await deleteFromJoin(connection, { recipe_id: id });
    // }
    if (!name) {
      name = "";
    }
    let catSql = "";
    let cats = [];
    if (Array.isArray(categories) && categories.length > 0) {
      categories.map((cat) => {
        cats.push(cat.id);
      });

      catSql = `AND id IN (SELECT recipe_id FROM ${constants.JOIN_TABLE} \
          WHERE category_id IN (?) GROUP BY recipe_id HAVING COUNT(*) = ${categories.length})`;
    }
    const sql = `SELECT * FROM ${constants.RECIPE_TABLE} WHERE name like ? ${catSql} `;

    connection.query(sql, [`%${name}%`, cats, catSql], (error, result) => {
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
