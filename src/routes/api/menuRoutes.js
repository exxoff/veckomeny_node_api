const express = require("express");
const path = require("path");
const router = express.Router();
const bodyParser = require("body-parser");
const moment = require("moment");
const { getMenuRecipes } = require("../../db/transactions");
const { get } = require("http");
const constants = require(path.resolve("src", "constants"));
const { establishConnection, disconnect } = require(path.resolve(
  "src/db",
  "MysqlDb.js"
));
const {
  getAll,
  getPost,
  addPost,
  updatePost,
  deletePost,
  deleteFromMenuRecipeXref,
  setMenuRecipesXref,
} = require(path.resolve("src/db", "transactions.js"));

const { requireApiAuth } = require(path.resolve(
  "src/middleware",
  "authMiddleware.js"
));
const logger = require(path.resolve("src/helpers", "logger"))(module);

const jsonParser = bodyParser.json();
router.use(requireApiAuth);

const TABLE = constants.MENU_TABLE;

// Work methods

/**
 * @api {get} /menus Get menus
 * @apiName GetMenus
 * @apiGroup menus
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Query String) {Date} [before] Filter on date (yyyy-MM-dd)
 * @apiParam (Query String) {Date} [after] Filter on date (yyyy-MM-dd)
 * @apiParam (Query String) {Date} [date] Filter on date (yyyy-MM-dd)
 * @apiParam (Query String) {String} [comment] Filter on comment
 *
 * @apiUse Pagination
 * @apiUse MultiEntityHeader
 * @apiUse MenuEntity
 *
 * @apiUse EntityTimeStamps
 *
 * @apiUse Error
 */

router.get("/", async (req, res) => {
  logger.debug(`Entering /menus (GET)`);
  let conn = undefined;
  const pagination = ({ limit, offset } = req.query);
  let searchObj = ({ date, before, after, comment } = req.query);
  try {
    conn = await establishConnection();
    let result = undefined;
    if (date) {
      result = await getMenuRecipes({ date: date });
    } else {
      result = await getAll(conn, TABLE, pagination, searchObj);
    }

    return res.status(result.retcode).json(result.retmsg.data);
  } catch (error) {
    logger.error(
      error.retmsg
        ? `Error, ${JSON.stringify(error.retmsg)}`
        : `Error, ${error.message}`
    );
    return error.retmsg
      ? res.status(error.retcode).json(error.retmsg)
      : res.status(500).json({ msg: "Application error" });
  } finally {
    if (conn) {
      disconnect(conn);
    }
  }
});

/**
 * @api {get} /menus/:id Get single menu
 * @apiName GetMenu
 * @apiGroup menus
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Parameters) {number} id Menu ID
 *
 * @apiUse SingleEntityHeader
 * @apiUse MenuEntity
 *
 * @apiUse EntityTimeStamps
 *
 * @apiUse Error
 */

router.get("/:id", async (req, res) => {
  logger.debug(`Entering /menus/:id (GET)`);

  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res
      .status(400)
      .json({ code: constants.E_ID_NAN, msg: constants.E_ID_NAN_MSG });
  }
  let conn = undefined;
  try {
    conn = await establishConnection();

    result = await getMenuRecipes({ id: id });

    return res.status(result.retcode).json(result.retmsg.data);
  } catch (error) {
    logger.error(
      error.retmsg
        ? `Error, ${JSON.stringify(error.retmsg)}`
        : `Error, ${error.message}`
    );
    return error.retmsg
      ? res.status(error.retcode).json(error.retmsg)
      : res.status(500).json({ msg: "Application error" });
  } finally {
    if (conn) {
      disconnect(conn);
    }
  }
});

/**
 * @api {post} /menus Add menu
 * @apiName AddMenu
 * @apiGroup menus
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Request Message Body) {Date} date The menu date
 * @apiParam (Request Message Body) {number} recipe_id The ID of the dish
 * @apiParam (Request Message Body) {String} [comment] Menu comment
 *
 * @apiUse SingleEntityHeader
 * @apiUse MenuEntity
 *
 * @apiUse EntityTimeStamps
 *
 * @apiUse Error
 */

router.post("/", jsonParser, async (req, res) => {
  logger.debug(`Entering /menus (POST)`);
  const { date, comment, recipe_id } = req.body;

  if (!date) {
    res.status(400);
    return res.json({
      code: constants.E_INFOMISSING,
      msg: constants.E_INFOMISSING_MSG,
      error: `Menu date is required`,
    });
  }

  if (!moment(date, "YYYY-MM-DD").isValid()) {
    return res.status(400).json({
      code: constants.E_NOTDATE,
      msg: constants.E_NOTDATE_MSG,
      error: `${date} is not a valid date.`,
    });
  }
  conn = undefined;
  try {
    conn = await establishConnection();

    const result = await addPost(conn, TABLE, {
      date,
      comment,
    });
    return res.status(result.retcode).json(result.retmsg.data);
  } catch (error) {
    logger.error(
      error.retmsg
        ? `Error, ${JSON.stringify(error.retmsg)}`
        : `Error, ${error.message}`
    );
    return error.retmsg
      ? res.status(error.retcode).json(error.retmsg)
      : res.status(500).json({ msg: "Application error" });
  } finally {
    if (conn) {
      disconnect(conn);
    }
  }
});

/**
 * @api {put} /menus/:id Update menu
 * @apiName UpdateMenu
 * @apiGroup menus
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Parameters) {number} id Menu ID
 *
 * @apiParam (Request Message Body) {Date} [date] The menu date
 * @apiParam (Request Message Body) {String} [comment] Menu comment
 *
 * @apiUse SingleEntityHeader
 * @apiUse MenuEntity
 *
 * @apiUse EntityTimeStamps
 *
 * @apiUse Error
 */
router.put("/:id", jsonParser, async (req, res) => {
  logger.debug(`Entering /menus/:id (PUT)`);
  const { date, comment } = req.body;
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({
      code: constants.E_ID_NAN,
      msg: constants.E_ID_NAN_MSG,
      error: `${id} is not a valid ID`,
    });
  }
  // const parsedId = parseInt(recipe_id);
  // if (isNaN(parsedId)) {
  //   return res.status(400).json({
  //     code: constants.E_ID_NAN,
  //     msg: constants.E_ID_NAN_MSG,
  //     error: `"${recipe_id}" is not a number`,
  //   });
  // }
  if (!date) {
    return res.status(400).json({
      code: constants.E_INFOMISSING,
      msg: constants.E_INFOMISSING,
      error: `Menu date is required`,
    });
  }

  if (!moment(date, "YYYY-MM-DD").isValid()) {
    return res.status(400).json({
      code: constants.E_NOTDATE,
      msg: constants.E_NOTDATE_MSG,
      error: `${date} is not a valid date.`,
    });
  }
  let conn = undefined;
  try {
    conn = await establishConnection();
    // const recResult = await getPost(conn, constants.RECIPE_TABLE, {
    //   id: parsedId,
    // });

    // if (recResult.retmsg.code == constants.E_NOTFOUND) {
    //   return res.status(400).json({
    //     code: constants.E_INVALIDDATA,
    //     msg: constants.E_INVALIDDATA_MSG,
    //     error: `${parsedId} is not a valid Recipe ID`,
    //   });
    // }
    const result = await updatePost(conn, TABLE, id, {
      date,
      comment,
      // recipe_id: parsedId,
    });

    return res.status(result.retcode).json(result.retmsg.data);
  } catch (error) {
    logger.error(
      error.retmsg
        ? `Error, ${JSON.stringify(error.retmsg)}`
        : `Error, ${error.message}`
    );
    return error.retmsg
      ? res.status(error.retcode).json(error.retmsg)
      : res.status(500).json({ msg: "Application error" });
  } finally {
    if (conn) {
      disconnect(conn);
    }
  }
});

// /**
//  * @api {delete} /menus/:id Delete menu
//  * @apiName DeleteMenu
//  * @apiGroup menus
//  * @apiVersion 1.0.0
//  * @apiPermission API
//  *
//  * @apiParam (Parameters) {number} id Menu ID
//  *
//  * @apiUse Error
//  */

// router.delete("/:id", async (req, res) => {
//   logger.debug(`Entering /menus/:id (DELETE)`);
//   const id = parseInt(req.params.id);
//   if (isNaN(id)) {
//     return res
//       .status(400)
//       .json({ code: constants.E_ID_NAN, msg: constants.E_ID_NAN_MSG });
//   }
//   let conn = undefined;
//   try {
//     conn = await establishConnection();
//     await conn.beginTransaction();
//     await deleteFromMenuRecipeXref(conn, { menu_id: id });
//     const result = await deletePost(conn, TABLE, { id });

//     conn.commit();
//     return res.status(result.retcode).json(result.retmsg.data);
//   } catch (error) {
//     conn.rollback();
//     logger.error(
//       error.retmsg
//         ? `Error, ${JSON.stringify(error.retmsg)}`
//         : `Error, ${error.message}`
//     );
//     return error.retmsg
//       ? res.status(error.retcode).json(error.retmsg)
//       : res.status(500).json({ msg: "Application error" });
//   } finally {
//     if (conn) {
//       disconnect(conn);
//     }
//   }
// });
/**
 * @api {delete} /menus/:id/:rid Delete Recipe from Menu
 * @apiName DeleteMenuRecipe
 * @apiGroup menus
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Parameters) {number} id Menu ID
 * @apiParam (Parameters) {number} rid Recipe ID
 *
 * @apiUse Error
 */

router.delete("/:id/:rid", async (req, res) => {
  logger.debug(`Entering /menus/:id (DELETE)`);
  //const rid = req.body.recipe_id;

  const { id, rid } = req.params;

  if (isNaN(id) || isNaN(rid)) {
    return res
      .status(400)
      .json({ code: constants.E_ID_NAN, msg: constants.E_ID_NAN_MSG });
  }
  let conn = undefined;
  try {
    conn = await establishConnection();
    await conn.beginTransaction();
    await deleteFromMenuRecipeXref(
      conn,
      {
        menu_id: parseInt(id),
      },
      { recipe_id: parseInt(rid) }
    );
    //const result = await deletePost(conn, TABLE, { id });

    conn.commit();

    return res.status(200).json({ msg: "OK" });
  } catch (error) {
    conn.rollback();
    logger.error(
      error.retmsg
        ? `Error, ${JSON.stringify(error.retmsg)}`
        : `Error, ${error.message}`
    );
    return error.retmsg
      ? res.status(error.retcode).json(error.retmsg)
      : res.status(500).json({ msg: "Application error" });
  } finally {
    if (conn) {
      disconnect(conn);
    }
  }
});

/**
 * @api {get} /menus/:id/recipes Get recipes for menu
 * @apiName GetMenuRecipes
 * @apiGroup menus
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Parameters) {Number} id ID
 * @apiUSe RecipeEntity
 * @apiUse RecipeCollectionExample
 * @apiUse EntityTimeStamps
 *
 * @apiUse Error
 */

router.get("/:id/recipes", async (req, res) => {
  logger.debug(`Entering /menus/:id/recipes (GET)`);
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res
      .status(400)
      .json({ code: constants.E_ID_NAN, msg: constants.E_ID_NAN_MSG });
  }
  let conn = undefined;
  try {
    conn = await establishConnection();

    result = await getMenuRecipes({ id: id });

    return res.status(result.retcode).json(result.retmsg.data);
  } catch (error) {
    logger.error(
      error.retmsg
        ? `Error, ${JSON.stringify(error.retmsg)}`
        : `Error, ${error.message}`
    );
    return error.retmsg
      ? res.status(error.retcode).json(error.retmsg)
      : res.status(500).json({ msg: "Application error" });
  } finally {
    if (conn) {
      disconnect(conn);
    }
  }
});

/**
 * @api {post} /menus/:id/recipes Add recipes to menu
 * @apiName AddMenuRecipes
 * @apiGroup menus
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Parameters) {Number} id Menu ID
 * @apiParam (Request Message Body) {Array} recipes Array of recipe IDs
 * @apiParam (Request Message Body) {number} recipes.id The ID of the dish
 *
 * @apiUse Error
 */

router.post("/:id/recipes", async (req, res) => {
  logger.debug(`Entering /menus/:id/recipes (POST)`);
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res
      .status(400)
      .json({ code: constants.E_ID_NAN, msg: constants.E_ID_NAN_MSG });
  }

  const { recipes } = req.body;
  const arr = recipes.map((rec) => ({ menu_id: id, recipe_id: rec.id }));
  // console.log("RECS:", arr);
  let conn = undefined;
  try {
    conn = await establishConnection();
    await conn.beginTransaction();
    await deleteFromMenuRecipeXref(conn, { menu_id: id });
    result = await setMenuRecipesXref(conn, arr);
    await conn.commit();
    return res.status(204).json({});
  } catch (error) {
    await conn.rollback();
    logger.error(
      error.retmsg
        ? `Error, ${JSON.stringify(error.retmsg)}`
        : `Error, ${error.message}`
    );
    return error.retmsg
      ? res.status(error.retcode).json(error.retmsg)
      : res.status(500).json({ msg: "Application error" });
  } finally {
    if (conn) {
      await disconnect(conn);
    }
  }
});

/**
 * @api {get} /menus/date/:date Get menus by specific date
 * @apiName GetMenusByDate
 * @apiGroup menus
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Parameters) {Date} date Menu date (yyyy-MM-dd)
 *
 * @apiUse SingleEntityHeader
 * @apiUSe MenuEntity
 * @apiSuccess {Array} recipes Recipes for the menu
 * @apiUse FullMenuExample
 *
 
 *
 * @apiUse Error
 */

router.get("/date/:date", async (req, res) => {
  let conn = undefined;

  let { date } = req.params;
  try {
    conn = await establishConnection();
    let result = undefined;
    if (date) {
      result = await getMenuRecipes(conn, { date: date });
    }

    return res.status(result.retcode).json(result.retmsg.data);
  } catch (error) {
    console.error("Error:", error);
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    if (conn) {
      disconnect(conn);
    }
  }
});
module.exports = router;
