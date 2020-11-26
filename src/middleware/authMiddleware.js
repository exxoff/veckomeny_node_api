const jwt = require("jsonwebtoken");
const path = require("path");
const { validateApiKey } = require(path.resolve("src/db", "auth.js"));

module.exports.requireApiAuth = async (req, res, next) => {
  const { authorization } = req.headers;
  if (authorization) {
    // console.log(authorization);
    const token = authorization.split(" ")[1];

    try {
      await validateApiKey(token);
      // console.log("Validated user id: ", apiId);
      next();
    } catch (error) {
      console.error(error);
      return res.status(error.retcode).json(error.retmsg);
    }
  } else {
    return res.status(401).json({ msg: "Unauthorized" });
  }
};

module.exports.requireUserAuth = async (req, res, next) => {
  const { authorization } = req.headers;
  if (authorization) {
    // console.log(authorization);
    const token = authorization.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, async (error, user) => {
      if (error) {
        console.error(error);
        return res.status(401).json({ msg: error.message });
      }
      req.user = user;
      next();
    });
  } else {
    return res.status(401).json({ msg: "Unauthorized" });
  }
};
