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
/**
 * @api {post} /auth/register Register new user
 * @apiName RegisterUser
 * @apiGroup auth
 * @apiVersion 1.0.0
 * @apiPermission none
 *
 * @apiSuccess {String} code Success code
 * @apiSuccess {String} msg Success message
 * @apiSuccess {Object[]} data Data
 * @apiSuccess {Number} data.id ID of the user
 * @apiSuccess {String} data.name Name of the user
 * @apiSuccess {String} data.username User's username
 * @apiSuccess {String} data.email User's email address
 * @apiSuccess {Boolean} data.admin Specify if user is Admin
 * @apiSuccess {Timestamp} data.created_at Record creation date
 * @apiSuccess {Timestamp} data.updated_at Last record update date
 */

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

    return res.status(result.retcode).json(result.retmsg.data);
  } catch (error) {
    console.error("Error:", error);
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

/**
 * @api {post} /auth/login User login
 * @apiName LoginUser
 * @apiGroup auth
 * @apiVersion 1.0.0
 * @apiPermission none
 *
 * @apiParam (Request Message Body) {String} username The user's Username
 * @apiParam (Request Message Body) {String} password The user's Password
 *
 * @apiSuccess {String} token Access token to be used in subsequent requests
 *
 * @apiError {String} code Error code
 * @apiError {String} msg Error message
 * @apiError {Object} data Empty data object
 *
 */

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
    console.error("Error:", error);
    return res.status(error.retcode).json(error.retmsg);
  }
});

// Routes for user administration

/**
 * @api {get} /auth/users Get a list of users
 * @apiName GetUsers
 * @apiGroup auth
 * @apiVersion 1.0.0
 * @apiPermission Admin
 *
 * @apiParam (Query String) {String} [name] Filter on name
 * @apiParam (Query String) {String} [username] Filter on username
 * @apiParam (Query String) {String} [email] Filter on email
 * @apiParam (Query String) {String} [admin] Filter on admin
 *
 * @apiUse Pagination
 *
 * @apiSuccess {String} code Success code
 * @apiSuccess {String} msg Success message
 * @apiSuccess {Object[]} data Data
 * @apiSuccess {Number} data.id ID of the user
 * @apiSuccess {String} data.name Name of the user
 * @apiSuccess {String} data.username User's username
 * @apiSuccess {String} data.email User's email address
 * @apiSuccess {Boolean} data.admin Specify if user is Admin
 * @apiSuccess {Timestamp} data.created_at Record creation date
 * @apiSuccess {Timestamp} data.updated_at Last record update date
 */
router.get("/users", requireUserAuth, async (req, res) => {
  let conn = undefined;
  try {
    conn = await establishConnection();
    const pagination = ({ limit, offset } = req.query);
    const user = ({ name, username, email, admin } = req.query);
    const result = await getAll(conn, constants.USERS_TABLE, pagination, user);

    if (result.retmsg.data) {
      result.retmsg.data.forEach((element) => {
        delete element.password;
        element.admin = !!+element.admin;
      });
    }

    return res.status(result.retcode).json(result.retmsg.data);
  } catch (error) {
    console.log("Error:", error);
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

/**
 * @api {get} /auth/users/:id Get a single user
 * @apiName GetUser
 * @apiGroup auth
 * @apiVersion 1.0.0
 * @apiPermission Admin
 *
 * @apiParam (Parameters) {number} id User's ID
 *
 * @apiUse SingleEntityHeader
 * @apiSuccess {Number} data.id ID of the user
 * @apiSuccess {String} data.name Name of the user
 * @apiSuccess {String} data.username User's username
 * @apiSuccess {String} data.email User's email address
 * @apiSuccess {Boolean} data.admin Specify if user is Admin
 *
 * @apiUse EntityTimeStamps
 */
router.get("/users/:id", requireUserAuth, async (req, res) => {
  let conn = undefined;
  const { id } = req.params;
  try {
    conn = await establishConnection();
    const result = await getPost(conn, constants.USERS_TABLE, { id });
    delete result.retmsg.data.password;
    result.retmsg.data.admin = !!+result.retmsg.data.admin;
    return res.status(result.retcode).json(result.retmsg.data);
  } catch (error) {
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

/**
 * @api {put} /auth/users/:id Update a user
 * @apiName UpdateUser
 * @apiGroup auth
 * @apiVersion 1.0.0
 * @apiPermission Admin
 *
 * @apiParam (Parameters) {number} id User's ID
 * @apiParam (Request Message Body) {String} [name] The user's name
 * @apiParam (Request Message Body) {String} [username] The user's username
 * @apiParam (Request Message Body) {String} [password] The user's password
 * @apiParam (Request Message Body) {String} [email] The user's email address
 * @apiParam (Request Message Body) {Boolean} [admin] Specify if user is admin
 *
 *@apiUse SingleEntityHeader
 * @apiSuccess {Number} data.id ID of the user
 * @apiSuccess {String} data.name Name of the user
 * @apiSuccess {String} data.username User's username
 * @apiSuccess {String} data.email User's email address
 * @apiSuccess {Boolean} data.admin Specifies if user is Admin
 * @apiUse EntityTimeStamps
 *
 * @apiUse Error
 */

router.put("/users/:id", requireUserAuth, async (req, res) => {
  const { id } = req.params;

  const newUser = ({ name, username, password, email } = req.body);
  let conn = undefined;
  try {
    conn = await establishConnection();
    await updatePost(conn, constants.USERS_TABLE, id, newUser);
    const result = await getPost(conn, constants.USERS_TABLE, { id });
    delete result.retmsg.data.password;
    result.retmsg.data.admin = !!+result.retmsg.data.admin;
    // const result = await updateUser(req.body, id);
    return res.status(result.retcode).json(result.retmsg.data);
  } catch (error) {
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

/**
 * @api {post} /auth/users Add a user
 * @apiName AddUser
 * @apiGroup auth
 * @apiVersion 1.0.0
 * @apiPermission Admin
 *
 * @apiParam (Request Message Body) {String} name The user's name
 * @apiParam (Request Message Body) {String} username The user's username
 * @apiParam (Request Message Body) {String} password The user's password
 * @apiParam (Request Message Body) {String} [email] The user's email address
 * @apiParam (Request Message Body) {Boolean} [admin] Specify if user is admin
 *
 * @apiUse SingleEntityHeader
 * @apiSuccess {Number} data.id ID of the user
 * @apiSuccess {String} data.name Name of the user
 * @apiSuccess {String} data.username User's username
 * @apiSuccess {String} data.email User's email address
 * @apiSuccess {Boolean} data.admin Specifies if user is Admin
 * @apiUse EntityTimeStamps
 *
 * @apiUse Error
 */

router.post("/users", requireUserAuth, jsonParser, async (req, res) => {
  const { username, password, name } = req.body;
  let { admin } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({
      code: constants.E_INFOMISSING,
      msg: constants.E_INFOMISSING_MSG,
      error: "Name, username and password are required parameters",
    });
  }
  if (!admin) {
    admin = 0;
  }
  const hash = await bcrypt.hash(password, 10);
  const newUser = { name, username, password: hash, admin };
  let conn = undefined;
  try {
    conn = await establishConnection();
    const result = await addPost(conn, constants.USERS_TABLE, newUser);
    //Strip the password from the result.
    delete result.retmsg.data.password;

    return res.status(result.retcode).json(result.retmsg.data);
  } catch (error) {
    console.error("Error:", error);
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

/**
 * @api {delete} /auth/users/:id Delete a user
 * @apiName DeleteUser
 * @apiGroup auth
 * @apiVersion 1.0.0
 * @apiPermission Admin
 *
 * @apiParam (Parameters) {number} id User's ID
 *
 * @apiSuccess {String} code Success code
 * @apiSuccess {String} msg Success message
 * @apiSuccess {String} data Number of affected rows
 *
 * @apiUse Error
 */

router.delete("/users/:id", requireUserAuth, jsonParser, async (req, res) => {
  const { id } = req.params;

  let conn = undefined;
  try {
    conn = await establishConnection();
    const result = await deletePost(conn, constants.USERS_TABLE, { id });

    return res.status(result.retcode).json(result.retmsg.data);
  } catch (error) {
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

// Routes for API keys

/**
 * @api {post} /auth/keys Add an API key
 * @apiName AddKey
 * @apiGroup auth
 * @apiVersion 1.0.0
 * @apiPermission Admin
 *
 * @apiParam (Request Message Body) {String} description Description of the key usage
 *
 * @apiUse SingleEntityHeader
 * @apiSuccess {Number} data.id ID of the key
 * @apiSuccess {String} data.description Description of the key usage
 * @apiSuccess {String} data.apikey The actual API key
 * @apiSuccess {Boolean} data.revoked Specifies if the key has been revoked
 * @apiUse EntityTimeStamps
 *
 * @apiUse Error
 */

router.post("/keys", requireUserAuth, async (req, res) => {
  let conn = undefined;
  const { description } = req.body;
  if (!description) {
    return res.status(400).json({
      code: constants.E_INFOMISSING,
      msg: constants.E_INFOMISSING_MSG,
      error: "description is required",
    });
  }

  const apiKey = randomString(40, "aA#");
  const newKey = { description, apiKey };
  try {
    conn = await establishConnection();
    const result = await addPost(conn, constants.KEYS_TABLE, newKey);
    result.retmsg.data.revoked = !!+result.retmsg.data.revoked;

    return res.status(result.retcode).json(result.retmsg.data);
  } catch (error) {
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

/**
 * @api {get} /auth/keys Get all API keys
 * @apiName GetKeys
 * @apiGroup auth
 * @apiVersion 1.0.0
 * @apiPermission Admin
 *
 * @apiUse Pagination
 *
 * @apiUse MultiEntityHeader
 * @apiSuccess {Number} data.id ID
 * @apiSuccess {String} data.description Description of the key's usage
 * @apiSuccess {Boolean} data.revoked Specifies if the key has been revoked
 * @apiUse EntityTimeStamps
 *
 * @apiUse Error
 */

router.get("/keys", requireUserAuth, async (req, res) => {
  let conn = undefined;
  const pagination = ({ limit, offset } = req.query);
  const { name } = req.query;
  try {
    conn = await establishConnection();
    const result = await getAll(conn, constants.KEYS_TABLE, pagination, {
      name,
    });

    if (result.retmsg.data) {
      result.retmsg.data.forEach((element) => {
        element.revoked = !!+element.revoked;
      });
    }

    return res.status(result.retcode).json(result.retmsg.data);
  } catch (error) {
    console.error(error);
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

/**
 * @api {get} /auth/keys Get an API key
 * @apiName GetKey
 * @apiGroup auth
 * @apiVersion 1.0.0
 * @apiPermission Admin
 *
 * @apiParam (Parameters) {number} id The key's ID
 *
 * @apiUse SingleEntityHeader
 * @apiSuccess {Number} data.id ID of the key
 * @apiSuccess {String} data.description Description of the key's usage
 * @apiSuccess {Boolean} data.revoked Specifies if the key has been revoked
 * @apiUse EntityTimeStamps
 *
 * @apiUse Error
 */

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
    result.retmsg.data.revoked = !!+result.retmsg.data.revoked;
    return res.status(result.retcode).json(result.retmsg.data);
  } catch (error) {
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

/**
 * @api {put} /auth/keys Update an API key
 * @apiName UpdateKey
 * @apiGroup auth
 * @apiVersion 1.0.0
 * @apiPermission Admin
 *
 * @apiParam (Parameters) {number} id The key's ID
 *
 * @apiUse SingleEntityHeader
 * @apiSuccess {Number} data.id ID of the key
 * @apiSuccess {String} data.description Description of the key's usage
 * @apiSuccess {Boolean} data.revoked Specifies if the key has been revoked
 * @apiUse EntityTimeStamps
 *
 * @apiUse Error
 */

router.put("/keys/:id", requireUserAuth, async (req, res) => {
  const { id } = req.params;
  const apikey = ({ description, revoked } = req.body);
  let conn = undefined;
  try {
    conn = await establishConnection();
    await updatePost(conn, constants.KEYS_TABLE, id, apikey);
    const result = await getPost(conn, constants.KEYS_TABLE, { id });
    result.retmsg.data.revoked = !!+result.retmsg.data.revoked;
    return res.status(result.retcode).json(result.retmsg.data);
  } catch (error) {
    return res.status(error.retcode).json(error.retmsg);
  } finally {
    disconnect(conn);
  }
});

module.exports = router;
