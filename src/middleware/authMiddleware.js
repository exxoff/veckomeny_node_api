const jwt = require("jsonwebtoken");
const path = require("path");
const logger = require(path.resolve("src/helpers", "logger"))(module);

const { validateApiKey } = require(path.resolve("src/db", "auth.js"));

module.exports.requireApiAuth = async (req, res, next) => {
  const { authorization } = req.headers;
  if (authorization) {
    try {
      logger.debug(`Authorization header is present`);
      const token = authorization.split(" ")[1];
      logger.debug(`Validating token [${token.substr(0, 10)}...]`);
      await validateApiKey(token);

      logger.info(`API key validated`);
      next();
    } catch (error) {
      logger.error(JSON.stringify(error.retmsg) || error.message);

      return res
        .status(error.retcode || 500)
        .json(error.retmsg || { msg: "Application error" });
    }
  } else {
    return res.status(401).json({ msg: "Unauthorized" });
  }
};

module.exports.requireUserAuth = async (req, res, next) => {
  const { authorization } = req.headers;
  if (authorization) {
    logger.debug(`Authorization header is present`);
    const token = authorization.split(" ")[1];
    logger.debug(`Validating token [${token.substr(0, 10)}...]`);
    jwt.verify(token, process.env.JWT_SECRET, async (error, user) => {
      if (error) {
        logger.error(`User validation failed. ${error.message}`);
        return res.status(401).json({ msg: error.message });
      }
      logger.info("User validated");
      req.user = user;
      next();
    });
  } else {
    logger.info(`Authorization header missing.`);
    return res.status(401).json({ msg: "Unauthorized" });
  }
};
