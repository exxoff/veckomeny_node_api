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

// Middleware
const jsonParser = bodyParser.json();
router.use(requireApiAuth);
const TABLE = constants.RECIPE_TABLE;

// Work methods

/**
 * @api {get} /recipes Get recipes
 * @apiName GetAllRecipes
 * @apiGroup Recipes
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Query String) {String} [name] Filter on name
 * @apiParam (Query String) {String[]} [cat] Filter on categories
 * @apiParam (Query String) {String} [comment] Filter on comment
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
  let conn = undefined;
  const pagination = ({ limit, offset } = req.query);
  let { name, cat, comment } = req.query;

  if (cat && !Array.isArray(cat)) {
    cat = [cat];
  }
  try {
    conn = await establishConnection();
    const result = await getAll(conn, TABLE, pagination, {
      name,
      categories: cat,
      comment,
    });
    if (result.retmsg.data) {
      result.retmsg.data.forEach((element) => {
        element.deleted = !!+element.deleted;
      });
    }
    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    console.log(error);
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

/**
 * @api {get} /recipes/:id Get recipe
 * @apiName GetRecipe
 * @apiGroup Recipes
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Parameters) {Number} id ID
 *
 * @apiUse SingleEntityHeader
 * @apiUSe RecipeEntity
 *
 * @apiUse EntityTimeStamps
 *
 * @apiUse Error
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;
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
    result.retmsg.data.deleted = !!+result.retmsg.data.deleted;
    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

/**
 * @api {post} /recipes Add a recipe
 * @apiName AddRecipe
 * @apiGroup Recipes
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
    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    if (conn) {
      disconnect(conn);
    }
  }
});

/**
 * @api {put} /recipes/:id Update a recipe
 * @apiName UpdateRecipe
 * @apiGroup Recipes
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
  const { name, link, comment, categories } = req.body;
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
    const updateRequest = await updatePost(conn, TABLE, id, {
      name,
      link,
      comment,
    });
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

    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    console.log(error);
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    if (conn) {
      disconnect(conn);
    }
  }
});

/**
 * @api {post} /recipes Add a recipe
 * @apiName AddRecipe
 * @apiGroup Recipes
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Parameters) {Number} id ID
 *
 * @apiSuccess {String} code Success code
 * @apiSuccess {String} msg Success message
 * @apiSuccess {String} data Number of affected rows
 *
 * @apiUse Error
 */

router.delete("/:id", async (req, res) => {
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
    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    console.error(error);
    if (conn) {
      conn.rollback();
    }
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    if (conn) {
      disconnect(conn);
    }
  }
});

/**
 * @api {get} /recipes/:id/categories Get categories for a recipe
 * @apiName GetRecipeCategories
 * @apiGroup Recipes
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
    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    if (conn) {
      disconnect(conn);
    }
  }
});

/**
 * @api {get} /recipes/:id/menus Get menus for a recipe
 * @apiName GetRecipeMenus
 * @apiGroup Recipes
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
    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    return res.status(error.retcode).json(error.retmsg);
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
//     return res.status(result.retcode).json(result.retmsg);
//   } catch (error) {
//     return res.status(error.retcode).json(error.retmsg);
//   } finally {
//     if (conn) {
//       disconnect(conn);
//     }
//   }
// });

module.exports = router;
