const app = require("./app");
const connectDatabase = require("./connectDatabase");
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");

require("dotenv").config();

connectDatabase();



Sentry.init({
  dsn: "https://6b195895235b45fa84556bd1e42c698a@o1340885.ingest.sentry.io/6613817",
  tracesSampleRate: 1.0,
});

// const transaction = Sentry.startTransaction({
//   op: "test",
//   name: "My First Test Transaction",
// });

// setTimeout(() => {
//   try {
//     foo();
//   } catch (e) {
//     Sentry.captureException(e);
//   } finally {
//     transaction.finish();
//   }
// }, 99);

app.listen(process.env.PORT, () => {
  console.log(
    `Server running on PORT: ${process.env.PORT} in ${process.env.NODE_ENV} mode`
  );
});

app.get("/", async (req, res, next) => {
  res.send("Online");
});
