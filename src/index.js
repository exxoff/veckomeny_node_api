require("dotenv").config();
const path = require("path");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARE

app.use(express.json());
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
  console.log(`Listening on port ${PORT}`);
});
