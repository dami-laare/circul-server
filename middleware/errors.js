const ErrorHandler = require("../utils/ErrorHandler");
const Sentry = require("@sentry/node");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  // Handles error responses in Development mode
  if (process.env.NODE_ENV === "DEVELOPMENT") {
    if (err.statusCode === 500) {
      Sentry.captureException(err);
    }
    console.log(err);
    res.status(err.statusCode).json({
      success: false,
      name: err.name,
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack,
    });
  }

  // Handles error responses in Production mode
  if (process.env.NODE_ENV === "PRODUCTION") {
    let error = { ...err };

    error.message = err.message || "Internal server error";

    if (err.name === "CastError") {
      const message = `Resource not found. Invalid: ${err.path}`;
      error = new ErrorHandler(message, 500);
    } else if (err.name === "ValidationError") {
      const message = Object.values(err.errors).map((error) => error.message);
      error = new ErrorHandler(message, 500);
    } else if (err.name === "MongoServerError" && err.code === 11000) {
      error = new ErrorHandler("A user already exists with these details", 500);
    } else if (err.name === "TokenExpiredError") {
      const message = "JSON web token has expired";
      error = new ErrorHandler(message, 500);
    } else if (err.name === "JsonWebTokenError") {
      const message = "JSON web token is invalid";
      error = new ErrorHandler(message, 500);
    } else if (err.statusCode === 500) {
      Sentry.captureException(err);

      error = new ErrorHandler("An error has occured", 500);
    }

    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      statusCode: error.statusCode,
    });
  }
};
