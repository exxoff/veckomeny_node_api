const path = require("path");
const constants = require(path.resolve("src", "constants"));

module.exports.getCategoryRecipes = async (connection, id) => {
  return new Promise((resolve, reject) => {
    sql = `select r.id,r.created_at,r.updated_at,r.name,r.link,r.comment FROM ${constants.JOIN_TABLE}\
    JOIN ${constants.RECIPE_TABLE} as r ON ${constants.JOIN_TABLE}.recipe_id=r.id\
    JOIN ${constants.CATEGORY_TABLE} as c ON ${constants.JOIN_TABLE}.category_id=c.id\
    WHERE category_id=?`;
    connection.query(sql, [id], (error, result) => {
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
