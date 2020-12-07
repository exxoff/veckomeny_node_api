require("dotenv").config();
const path = require("path");
const bcrypt = require("bcrypt");
const { info } = require("console");
const { exit } = require("process");

const { establishConnection, disconnect } = require(path.resolve(
  "src/db",
  "MysqlDb.js"
));
const { addPost } = require(path.resolve("src/db", "transactions.js"));
const constants = require(path.resolve("src", "constants"));

const addAdminUser = async (username, password, name) => {
  const admin = true;
  if (!username || !password || !name) {
    console.log("Not enough info.");
    exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  const newUser = { name, username, password: hash, admin };
  let conn = undefined;
  try {
    conn = await establishConnection();
    // console.log("Connection:", conn);
    const result = await addPost(conn, "users", newUser);
    //Strip the password from the result.
    //delete result.data.password;

    console.log("User created.");
  } catch (error) {
    console.error("User not created:", error.retmsg.error);
  } finally {
    disconnect(conn);
  }
};

addAdminUser("admin", "changeme", "Admin user");
