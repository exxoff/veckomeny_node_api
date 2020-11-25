const express = require("express");
const path = require("path");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const { validateUser } = require(path.resolve("src/db", "auth.js"));
const { requireUserAuth } = require(path.resolve(
  "src/middleware",
  "authMiddleware.js"
));
const { establishConnection, disconnect } = require(path.resolve(
  "src/db",
  "MysqlDb.js"
));
const {
  getAll,
  updatePost,
  addPost,
  deletePost,
  getPost,
} = require(path.resolve("src/db", "transactions.js"));
const constants = require(path.resolve("src", "constants"));

const jsonParser = bodyParser.json();

function randomString(length, chars) {
  var mask = "";
  if (chars.indexOf("a") > -1) mask += "abcdefghijklmnopqrstuvwxyz";
  if (chars.indexOf("A") > -1) mask += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (chars.indexOf("#") > -1) mask += "0123456789";
  if (chars.indexOf("!") > -1) mask += "~`!@#$%^&*()_+-={}[]:\";'<>?,./|\\";
  var result = "";
  for (var i = length; i > 0; --i)
    result += mask[Math.floor(Math.random() * mask.length)];
  return result;
}
// Routes for users

router.post("/register", async (req, res) => {
  // Not accepting user registration,comment out below to accept new users.

  if (parseInt(process.env.ALLOW_REGISTRATION) !== 1) {
    return res.status(403).json({
      code: constants.I_NOT_ACCEPTING_NEW_USERS,
      msg: constants.I_NOT_ACCEPTING_NEW_USERS_MSG,
    });
  }

  const { username, password, name } = req.body;
  const admin = false;

  if (!username || !password || !name) {
    return res
      .status(400)
      .json({ msg: "Name, Username and password are required" });
  }

  let conn = undefined;
  const hash = await bcrypt.hash(password, 10);
  const newUser = { name, username, password: hash, admin };
  try {
    conn = await establishConnection();
    const result = await addPost(conn, constants.USERS_TABLE, newUser);
    //Strip the password from the result.
    delete result.retmsg.data.password;

    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    // console.log("Error:", error);
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    if (!username || !password) {
      return res
        .status(400)
        .json({ msg: "Username and password are required" });
    }
    // console.log(username, password);

    const token = await validateUser(username, password);
    // console.log("Token:", token);
    return res.json({ token: token });
  } catch (error) {
    return res.status(error.retcode).json(error.retmsg);
  }
});

// Routes for user administration

router.get("/users", requireUserAuth, async (req, res) => {
  let conn = undefined;
  try {
    conn = await establishConnection();
    const pagination = ({ limit, offset } = req.query);
    const user = ({ name, email, admin } = req.query);
    const result = await getAll(conn, constants.USERS_TABLE, pagination, user);

    console.log("Data:", result.data);
    if (result.retmsg.data) {
      result.retmsg.data.forEach((element) => {
        delete element.password;
      });
    }

    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    console.log("Error:", error);
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

router.get("/users/:id", requireUserAuth, async (req, res) => {
  let conn = undefined;
  const { id } = req.params;
  try {
    conn = await establishConnection();
    const result = await getPost(conn, constants.USERS_TABLE, { id });
    delete result.retmsg.data.password;
    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

router.put("/users/:id", requireUserAuth, async (req, res) => {
  const { id } = req.params;

  const newUser = ({ name, username, password } = req.body);
  try {
    const conn = await establishConnection();
    const result = await updatePost(conn, constants.USERS_TABLE, id, newUser);
    // const result = await updateUser(req.body, id);
    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

router.post("/users", requireUserAuth, jsonParser, async (req, res) => {
  const { username, password, name } = req.body;
  let { admin } = req.body;

  if (!username || !password || !name) {
    return res
      .status(400)
      .json({ msg: "Name, Username and password are required" });
  }
  if (!admin) {
    admin = 0;
  }
  const hash = await bcrypt.hash(password, 10);
  const newUser = { name, username, password: hash, admin };
  try {
    const conn = await establishConnection();
    const result = await addPost(conn, constants.USERS_TABLE, newUser);
    //Strip the password from the result.
    delete result.data.password;

    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

router.delete("/users/:id", requireUserAuth, jsonParser, async (req, res) => {
  const { id } = req.params;

  try {
    const conn = await establishConnection();
    const result = await deletePost(conn, constants.USERS_TABLE, { id });

    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

// Routes for API keys

router.post("/keys", requireUserAuth, async (req, res) => {
  let conn = undefined;
  const { description } = req.body;
  if (!description) {
    return res.status(400).json({
      code: E_INFOMISSING,
      msg: constants.E_INFOMISSING_MSG,
      data: "description is required",
    });
  }

  const apiKey = randomString(40, "aA#");
  const newKey = { description, apiKey };
  try {
    conn = await establishConnection();
    const result = await addPost(conn, constants.KEYS_TABLE, newKey);

    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

router.get("/keys", requireUserAuth, async (req, res) => {
  let conn = undefined;
  const pagination = ({ limit, offset } = req.query);
  const { name } = req.query;
  try {
    conn = await establishConnection();
    const result = await getAll(conn, constants.KEYS_TABLE, pagination, {
      name,
    });

    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    console.error(error);
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

router.get("/keys/:id", requireUserAuth, async (req, res) => {
  let conn = undefined;
  const { id } = req.params;
  if (isNaN(id)) {
    return res.status(400).json({
      code: constants.E_ID_NAN,
      msg: constants.E_ID_NAN_MSG,
      data: "id must be a number",
    });
  }
  try {
    conn = await establishConnection();
    const result = await getPost(conn, constants.KEYS_TABLE, { id });
    // console.log(result);
    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

router.put("/keys/:id", requireUserAuth, async (req, res) => {
  const { id } = req.params;
  const apikey = ({ description, revoked } = req.body);
  let conn = undefined;
  try {
    conn = await establishConnection();
    await updatePost(conn, constants.KEYS_TABLE, id, apikey);
    const result = await getPost(conn, constants.KEYS_TABLE, { id });
    return res.status(result.retcode).json(result.retmsg);
  } catch (error) {
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

module.exports = router;
