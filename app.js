const cors = require("cors");
const cookieParser = require("cookie-parser");
const express = require("express");
const errors = require("./middleware/errors");
const paystackRoutes = require("./routes/paystackRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/api/v1", paystackRoutes);
app.use("/api/v1", authRoutes);

app.use(errors);

module.exports = app;
