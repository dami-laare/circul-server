const app = require("./app");
const connectDatabase = require("./connectDatabase");
const Sentry = require("@sentry/node");

require("dotenv").config();

connectDatabase();

Sentry.init({
  dsn: "https://6b195895235b45fa84556bd1e42c698a@o1340885.ingest.sentry.io/6613817",
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
});

// Handling uncaught exceptions
process.on("uncaughtException", (err) => {
  Sentry.captureException(err);
});

app.listen(process.env.PORT, () => {
  console.log(
    `Server running on PORT: ${process.env.PORT} in ${process.env.NODE_ENV} mode`
  );
});

app.get("/", async (req, res, next) => {
  res.send("Online");
});

// Handling unhandled promise rejections
process.on("unhandledRejection", (err) => {
  Sentry.captureException(err);
});
