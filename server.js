const app = require("./app");
const connectDatabase = require("./connectDatabase");

require("dotenv").config();

connectDatabase();

app.listen(process.env.PORT, () => {
  console.log(
    `Server running on PORT: ${process.env.PORT} in ${process.env.NODE_ENV} mode`
  );
});

app.get("/", async (req, res, next) => {
  res.send("Online");
});
