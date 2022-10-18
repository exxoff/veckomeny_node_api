const express = require("express");
const path = require("path");
const router = express.Router();
const bodyParser = require("body-parser");
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
  getRecipeCategories,
  getRecipeMenus,
  setRecipeCategories,
} = require(path.resolve("src/db", "transactions.js"));
const { requireApiAuth } = require(path.resolve(
  "src/middleware",
  "authMiddleware.js"
));

// const { getBoolean } = require("../../helpers/getBoolean");
const { getBoolean } = require(path.resolve("src/helpers", "getBoolean"));
const logger = require(path.resolve("src/helpers", "logger"))(module);

// Middleware
const jsonParser = bodyParser.json();
router.use(requireApiAuth);
const TABLE = constants.RECIPE_TABLE;

// Work methods

/**
 * @api {get} /recipes Get recipes
 * @apiName GetAllRecipes
 * @apiGroup recipes
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Query String) {String} [name] Filter on name
 * @apiParam (Query String) {String[]} [cat] Filter on categories
 * @apiParam (Query String) {String} [comment] Filter on comment
 * @apiParam (Query String) {Boolean} [deleted] Filter on deleted
 * @apiParam (Query String) {Boolean} [includeDeleted] Whether to iclude deleted recipes in result
 *
 * @apiUse Pagination
 * @apiUse MultiEntityHeader
 * @apiUSe RecipeEntity
 *
 * @apiUse EntityTimeStamps
 *
 * @apiUse Error
 */

router.get("/", async (req, res) => {
  logger.debug(`Entering /recipes (GET)`);

  let conn = undefined;
  const pagination = ({ limit, offset } = req.query);
  let { name, cat, comment, deleted, includeDeleted } = req.query;

  if (!deleted) {
    deleted = "false";
  }
  willIncludeDeleted = getBoolean(includeDeleted);

  if (cat && !Array.isArray(cat)) {
    //console.log("CATS:", cat);
    const cats = cat.split(",");
    cat = cats;
  }
  try {
    conn = await establishConnection();
    const result = await getAll(conn, TABLE, pagination, {
      name,
      categories: cat,
      comment,
      deleted,
    });
    let washedResult = undefined;

    if (result.retmsg.data) {
      if (!willIncludeDeleted) {
        washedResult = result.retmsg.data.filter((element) => {
          return element.deleted !== 1;
        });
      } else {
        washedResult = result.retmsg.data;
      }
      washedResult.forEach((element) => {
        element.deleted = !!+element.deleted;
      });
    }
    return res.status(result.retcode).json(washedResult);
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
    disconnect(conn);
  }
});

/**
 * @api {get} /recipes/:id Get recipe
 * @apiName GetRecipe
 * @apiGroup recipes
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Parameters) {Number} id ID
 *
 * @apiParam (Query String) {Boolean} [includeDeleted] Whether to iclude deleted recipes in result
 *
 * @apiUse SingleEntityHeader
 * @apiUSe RecipeEntity
 *
 * @apiUse EntityTimeStamps
 *
 * @apiUse Error
 */

router.get("/:id", async (req, res) => {
  logger.debug(`Entering /recipes/:id (GET)`);

  const { id } = req.params;
  const { includeDeleted } = req.query;
  let deleted = getBoolean(includeDeleted);
  console.log("INCLUDE DELETED:", deleted);
  if (includeDeleted && includeDeleted.toLocaleLowerCase === "true") {
    deleted = true;
  }
  if (isNaN(id)) {
    return res.status(400).json({
      code: constants.E_ID_NAN,
      msg: constants.E_ID_NAN_MSG,
      data: "id must be a number",
    });
  }
  let conn = undefined;
  try {
    conn = await establishConnection();

    const result = await getPost(conn, TABLE, { id });

    if (result.length < 1) {
      return res.status(404).json({});
    } else {
      if (!deleted && result.retmsg.data.deleted === 1) {
        return res.status(404).json({});
      }
      result.retmsg.data.deleted = !!+result.retmsg.data.deleted;
      return res.status(result.retcode).json(result.retmsg.data);
    }
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
    disconnect(conn);
  }
});

/**
 * @api {post} /recipes Add a recipe
 * @apiName AddRecipe
 * @apiGroup recipes
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Request Message Body) {String} name Name of the recipe
 * @apiParam (Request Message Body) {String} [link] URL to the recipe
 * @apiParam (Request Message Body) {String} [comment] Recipe comment
 *
 * @apiUse SingleEntityHeader
 * @apiUSe RecipeEntity
 * @apiUse EntityTimeStamps
 *
 * @apiUse Error
 */
router.post("/", jsonParser, async (req, res) => {
  logger.debug(`Entering /recipes (POST)`);

  const { name, link, comment, categories } = req.body;
  if (!name) {
    res.status(400);
    return res.json({
      code: constants.E_NAME_REQ,
      msg: constants.E_NAME_REQ_MSG,
    });
  }
  conn = undefined;
  try {
    conn = await establishConnection();
    const result = await addPost(conn, TABLE, { name, link, comment });

    // const post = await getPost(conn, TABLE, { id: result.data });

    const post = result.retmsg;
    // console.log("New recipe:", post);
    let insertObj = [];

    categories.map((cat) => {
      insertObj.push([post.data.id, cat.id]);
    });
    // console.log("Cats:", insertObj);
    await setRecipeCategories(conn, undefined, insertObj);
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
 * @api {put} /recipes/:id Update a recipe
 * @apiName UpdateRecipe
 * @apiGroup recipes
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Parameters) {Number} id ID
 *
 * @apiParam (Request Message Body) {String} [name] Name of the recipe
 * @apiParam (Request Message Body) {String} [link] URL to the recipe
 * @apiParam (Request Message Body) {String} [comment] Recipe comment
 *
 * @apiUse SingleEntityHeader
 * @apiUSe RecipeEntity
 * @apiUse EntityTimeStamps
 *
 * @apiUse Error
 */

router.put("/:id", jsonParser, async (req, res) => {
  logger.debug(`Entering /recipes/:id (PUT)`);

  const updateObj = ({ name, link, comment, categories, image_url } = req.body);
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res
      .status(400)
      .json({ code: constants.E_ID_NAN, msg: constants.E_ID_NAN_MSG });
  }

  if (!name) {
    return res
      .status(400)
      .json({ code: constants.E_NAME_REQ, msg: constants.E_NAME_REQ_MSG });
  }
  let conn = undefined;
  try {
    conn = await establishConnection();
    const updateRequest = await updatePost(conn, TABLE, id, updateObj);
    if (categories) {
      let insertObj = [];
      if (updateRequest.retmsg.data) {
        categories.map((cat) => {
          insertObj.push([id, cat.id]);
        });
        await setRecipeCategories(conn, id, insertObj);
      }
    }

    const result = await getPost(conn, TABLE, { id });

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
 * @api {delete} /recipes Delete a recipe
 * @apiName DeleteRecipe
 * @apiGroup recipes
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Parameters) {Number} id ID
 *
 *
 * @apiUse Error
 */

router.delete("/:id", async (req, res) => {
  logger.debug(`Entering /recipes/:id (DELETE)`);

  const { id } = req.params;
  const { save } = req.query;
  if (isNaN(id)) {
    return res
      .status(400)
      .json({ code: constants.E_ID_NAN, msg: constants.E_ID_NAN_MSG });
  }
  let conn = undefined;
  try {
    conn = await establishConnection();
    await conn.beginTransaction();
    // await deleteFromJoin(conn, { recipe_id: id });
    let result = undefined;
    // if (save.toLocaleLowerCase() === "yes") {
    result = await updatePost(conn, TABLE, id, { deleted: true });
    // } else {
    //   result = await deletePost(conn, TABLE, { id });
    // }

    await conn.commit();
    return res.status(204).json({});
  } catch (error) {
    console.error(error);
    if (conn) {
      conn.rollback();
    }
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
 * @api {get} /recipes/:id/categories Get categories for a recipe
 * @apiName GetRecipeCategories
 * @apiGroup recipes
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Parameters) {Number} id ID
 *
 * @apiUse Pagination
 * @apiUse MultiEntityHeader
 * @apiUSe CategoryEntity
 *
 * @apiUse EntityTimeStamps
 *
 * @apiUse Error
 */

router.get("/:id/categories", async (req, res) => {
  logger.debug(`Entering /recipes/:id/categories (GET)`);

  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res
      .status(400)
      .json({ code: constants.E_ID_NAN, msg: constants.E_ID_NAN_MSG });
  }

  let conn = undefined;

  try {
    conn = await establishConnection();
    const result = await getRecipeCategories(conn, id);
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
 * @api {get} /recipes/:id/menus Get menus for a recipe
 * @apiName GetRecipeMenus
 * @apiGroup recipes
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Parameters) {Number} id ID
 *
 * @apiUse Pagination
 * @apiUse MultiEntityHeader
 * @apiUSe MenuEntity
 *
 * @apiUse EntityTimeStamps
 *
 * @apiUse Error
 */

router.get("/:id/menus", async (req, res) => {
  logger.debug(`Entering /recipes/:id/menus (GET)`);
  const { id } = req.params;

  if (isNaN(id)) {
    return res
      .status(400)
      .json({ code: constants.E_ID_NAN, msg: constants.E_ID_NAN_MSG });
  }
  let conn = undefined;

  try {
    conn = await establishConnection();
    const result = await getRecipeMenus(conn, id);
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

// // SEARCH RECIPES
// router.get("/search", async (req, res) => {
//   const id = parseInt(req.params.id);
//   if (isNaN(id)) {
//     return res
//       .status(400)
//       .json({ code: constants.E_ID_NAN, msg: constants.E_ID_NAN_MSG });
//   }
//   let conn = undefined;

//   try {
//     conn = await establishConnection();
//     const result = await getRecipeMenus(conn, id);
//     return res.status(result.retcode).json(result.retmsg.data);
//   } catch (error) {
//     return res.status(error.retcode).json(error.retmsg);
//   } finally {
//     if (conn) {
//       disconnect(conn);
//     }
//   }
// });

module.exports = router;
