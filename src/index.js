require("dotenv").config();
const path = require("path");
const express = require("express");
const logger = require(path.resolve("src/helpers", "logger"))(module);
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARE
app.use(cors());
app.use(express.json());

app.all("*", (req, res, next) => {
  logger.info(
    `Request: ${JSON.stringify({
      method: req.method,
      query: req.query,
      params: req.params,
      client_ip: req.connection.remoteAddress,
    })}`
  );
  next();
});
app.use("/doc", express.static(path.resolve("doc")));
// app.use("/api/v1/", requireApiAuth);

app.use("/api/v1/recipes", require("./routes/api/recipeRoutes"));
app.use("/api/v1/categories", require("./routes/api/categoryRoutes"));
app.use("/api/v1/menus", require("./routes/api/menuRoutes"));
app.use("/api/v1/auth", require("./routes/api/authRoutes"));

app.get("/", (req, res) => {
  return res.redirect("/doc");
});

app.listen(PORT, () => {
  logger.info(`Listening on port ${PORT}`);
  // console.log(`Listening on port ${PORT}`);
});
