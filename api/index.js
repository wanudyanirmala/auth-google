const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Vercel OK 🚀");
});

module.exports = app;