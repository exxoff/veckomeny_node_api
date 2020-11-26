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
  deleteFromJoin,
  deletePost,
  getCategoryRecipes,
} = require(path.resolve("src/db", "transactions.js"));
const { requireApiAuth } = require(path.resolve(
  "src/middleware",
  "authMiddleware.js"
));

const jsonParser = bodyParser.json();
router.use(requireApiAuth);

const TABLE = constants.CATEGORY_TABLE;
// Work methods

/**
 * @api {get} /categories Get categories
 * @apiName GetCategories
 * @apiGroup categories
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Query String) {String} [name] Filter on name
 *
 * @apiUse Pagination
 * @apiUse MultiEntityHeader
 * @apiUSe CategoryEntity
 * @apiUse EntityTimeStamps
 *
 * @apiUse Error
 */

router.get("/", async (req, res) => {
  let conn = undefined;
  const pagination = ({ limit, offset } = req.query);
  const { name } = req.query;
  console.log("Name:", name);
  try {
    conn = await establishConnection();
    const result = await getAll(conn, TABLE, pagination, { name });

    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    console.log("ERROR:", error);
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    if (conn) {
      disconnect(conn);
    }
  }
});

/**
 * @api {get} /categories/:id Get category
 * @apiName GetCategory
 * @apiGroup categories
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Parameters) {Number} id ID
 *
 * @apiUse SingleEntityHeader
 * @apiUSe CategoryEntity
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
      data: `${id} is not a number`,
    });
  }
  let conn = undefined;

  try {
    conn = await establishConnection();
    const result = await getPost(conn, TABLE, { id });

    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

/**
 * @api {post} /categories Add category
 * @apiName AddCategory
 * @apiGroup categories
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 *
 * @apiParam (Request Message Body) {String} name Name of the Category
 *
 * @apiUse SingleEntityHeader
 * @apiUSe CategoryEntity
 * @apiUse EntityTimeStamps
 *
 * @apiUse Error
 */

router.post("/", jsonParser, async (req, res) => {
  let conn = undefined;
  let { name } = req.body;
  if (!name) {
    res.status(400);
    return res.json({
      code: constants.E_NAME_REQ,
      msg: constants.E_NAME_REQ_MSG,
    });
  }

  try {
    conn = await establishConnection();
    const result = await addPost(conn, TABLE, { name });

    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

/**
 * @api {put} /categories Update category
 * @apiName UpdateCategory
 * @apiGroup categories
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Parameters) {Number} id ID
 *
 * @apiParam (Request Message Body) {String} name Name of the Category
 *
 * @apiUse SingleEntityHeader
 * @apiUSe CategoryEntity
 * @apiUse EntityTimeStamps
 *
 * @apiUse Error
 */
router.put("/:id", jsonParser, async (req, res) => {
  let conn = undefined;
  const { name } = req.body;
  const { id } = req.params;

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

  try {
    conn = await establishConnection();
    await updatePost(conn, TABLE, id, { name });
    const result = await getPost(conn, TABLE, { id });
    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

/**
 * @api {delete} /categories Delete category
 * @apiName DeleteCategory
 * @apiGroup categories
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
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res
      .status(400)
      .json({ code: constants.E_ID_NAN, msg: constants.E_ID_NAN_MSG });
  }
  let conn = undefined;
  try {
    conn = await establishConnection();
    await conn.beginTransaction();
    await deleteFromJoin(conn, { id });

    const delResult = await deletePost(conn, TABLE, { id });

    await conn.commit();
    return res.status(delResult.retcode).json(delResult.retmsg);
  } catch (error) {
    if (conn) {
      conn.rollback();
    }

    res.status(500).json(error.retmsg);
  } finally {
    if (conn) {
      disconnect(conn);
    }
  }
});

/**
 * @api {get} /categories/:id/recipes Get recipes for category
 * @apiName GetCategoryRecipes
 * @apiGroup categories
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Parameters) {Number} id ID
 *
 * @apiUse Pagination
 * @apiUse MultiEntityHeader
 * @apiUSe RecipeEntity
 * @apiUse RecipeCollectionExample
 * @apiUse EntityTimeStamps
 *
 * @apiUse Error
 */

router.get("/:id/recipes", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res
      .status(400)
      .json({ code: constants.E_ID_NAN, msg: constants.E_ID_NAN_MSG });
  }

  let conn = undefined;

  try {
    conn = await establishConnection();
    const result = await getCategoryRecipes(conn, id);
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
    if (conn) {
      disconnect(conn);
    }
  }
});

module.exports = router;
