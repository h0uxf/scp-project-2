const express = require("express");
const cors = require("cors");

const app = express();

//middleware
app.use(cors());
app.use(express.json());

// routes
const mainRouter = require("./routes/main");
app.use("/", mainRouter);

module.exports = app;
