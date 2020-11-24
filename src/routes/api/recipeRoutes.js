const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const moment = require("moment");
const constants = require("../../constants");
const { establishConnection, disconnect } = require("../../db/MysqlDb");
const { requireApiAuth } = require("../../middleware/authMiddleware");
const {
  getAll,
  getPost,
  addPost,
  updatePost,
  deleteFromJoin,
  deletePost,
} = require("../../db/transactions");
const {
  getRecipeCategories,
  getRecipeMenus,
  searchRecipes,
  setRecipeCategories,
} = require("../../db/recipes");

// Middleware
const jsonParser = bodyParser.json();
router.use(requireApiAuth);
const TABLE = constants.RECIPE_TABLE;

// Work methods

//GET ALL POSTS
router.get("/", async (req, res) => {
  let conn = undefined;
  const pagination = ({ limit, offset } = req.query);
  let { name, cat } = req.query;

  if (cat && !Array.isArray(cat)) {
    cat = [cat];
  }
  try {
    conn = await establishConnection();
    const result = await getAll(conn, TABLE, pagination, {
      name,
      categories: cat,
    });

    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    console.log(error);
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

// GET SINGLE POST
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
    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

// ADD
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
    console.log("New recipe:", post);
    let insertObj = [];

    categories.map((cat) => {
      insertObj.push([post.data.id, cat.id]);
    });
    console.log("Cats:", insertObj);
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

// UPDATE
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
    const now = moment().clone().format();
    conn = await establishConnection();
    const updateRequest = await updatePost(conn, TABLE, id, {
      name,
      link,
      comment,
      updated_at: now,
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

//DELETE
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (isNaN(id)) {
    return res
      .status(400)
      .json({ code: constants.E_ID_NAN, msg: constants.E_ID_NAN_MSG });
  }
  let conn = undefined;
  try {
    conn = await establishConnection();
    await conn.beginTransaction();
    await deleteFromJoin(conn, { recipe_id: id });
    const result = await deletePost(conn, TABLE, { id });
    await conn.commit();
    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
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

// GET CATEGORIES FOR RECIPE
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

// GET MENUS FOR RECIPE
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

// SEARCH RECIPES
router.get("/search", async (req, res) => {
  const id = parseInt(req.params.id);
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
module.exports = router;
