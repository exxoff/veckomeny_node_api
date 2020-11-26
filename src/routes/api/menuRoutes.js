const express = require("express");
const path = require("path");
const router = express.Router();
const bodyParser = require("body-parser");
const moment = require("moment");
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
} = require(path.resolve("src/db", "transactions.js"));

const { requireApiAuth } = require(path.resolve(
  "src/middleware",
  "authMiddleware.js"
));

const jsonParser = bodyParser.json();
router.use(requireApiAuth);

const TABLE = constants.MENU_TABLE;

// Work methods

/**
 * @api {get} /menus Get all menus
 * @apiName GetMenus
 * @apiGroup Menus
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Query String) {Date} [before] Filter on date (yyyy-MM-dd)
 * @apiParam (Query String) {Date} [after] Filter on date (yyyy-MM-dd)
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
  let conn = undefined;
  const pagination = ({ limit, offset } = req.query);
  let searchObj = ({ before, after, comment } = req.query);
  try {
    conn = await establishConnection();
    const result = await getAll(conn, TABLE, pagination, searchObj);

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
 * @api {get} /menus/:id Get single menu
 * @apiName GetMenu
 * @apiGroup Menus
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
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res
      .status(400)
      .json({ code: constants.E_ID_NAN, msg: constants.E_ID_NAN_MSG });
  }
  let conn = undefined;
  try {
    conn = await establishConnection();

    result = await getPost(conn, TABLE, { id });
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
 * @api {post} /menus Add menu
 * @apiName AddMenu
 * @apiGroup Menus
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
  const { date, comment, recipe_id } = req.body;

  if (!date) {
    res.status(400);
    return res.json({
      code: constants.E_INFOMISSING,
      msg: constants.E_INFOMISSING_MSG,
      error: `Menu date is required`,
    });
  }
  if (!recipe_id) {
    return res.status(400).json({
      code: constants.E_INFOMISSING,
      msg: constants.E_INFOMISSING,
      error: `Recipe ID is required`,
    });
  }
  const parsedId = parseInt(recipe_id);
  if (isNaN(parsedId)) {
    return res.status(400).json({
      code: constants.E_ID_NAN,
      msg: constants.E_ID_NAN_MSG,
      error: `"${recipe_id}" is not a number`,
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
    const chkResult = await getPost(conn, constants.RECIPE_TABLE, {
      id: parsedId,
    });
    console.log(chkResult);
    if (chkResult.retmsg.code == constants.E_NOTFOUND) {
      return res.status(400).json({
        code: constants.E_INVALIDDATA,
        msg: constants.E_INVALIDDATA_MSG,
        error: `${parsedId} is not a valid Recipe ID`,
      });
    }
    const result = await addPost(conn, TABLE, {
      date,
      comment,
      recipe_id: parsedId,
    });
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
 * @api {put} /menus/:id Update menu
 * @apiName UpdateMenu
 * @apiGroup Menus
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Parameters) {number} id Menu ID
 *
 * @apiParam (Request Message Body) {Date} [date] The menu date
 * @apiParam (Request Message Body) {number} [recipe_id] The ID of the dish
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
  const { date, comment, recipe_id } = req.body;
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({
      code: constants.E_ID_NAN,
      msg: constants.E_ID_NAN_MSG,
      error: `${id} is not a valid ID`,
    });
  }
  const parsedId = parseInt(recipe_id);
  if (isNaN(parsedId)) {
    return res.status(400).json({
      code: constants.E_ID_NAN,
      msg: constants.E_ID_NAN_MSG,
      error: `"${recipe_id}" is not a number`,
    });
  }
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
    const recResult = await getPost(conn, constants.RECIPE_TABLE, {
      id: parsedId,
    });

    if (recResult.retmsg.code == constants.E_NOTFOUND) {
      return res.status(400).json({
        code: constants.E_INVALIDDATA,
        msg: constants.E_INVALIDDATA_MSG,
        error: `${parsedId} is not a valid Recipe ID`,
      });
    }
    const result = await updatePost(conn, TABLE, id, {
      date,
      comment,
      recipe_id: parsedId,
    });

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
 * @api {delete} /menus/:id Delete menu
 * @apiName DeleteMenu
 * @apiGroup Menus
 * @apiVersion 1.0.0
 * @apiPermission API
 *
 * @apiParam (Parameters) {number} id Menu ID
 *
 *
 * @apiSuccess {String} code Success code
 * @apiSuccess {String} msg Success message
 * @apiSuccess {String} data Number of affected rows
 *
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

    const result = await deletePost(conn, TABLE, { id });

    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    if (conn) {
      disconnect(conn);
    }
  }
});

module.exports = router;
