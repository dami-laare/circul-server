const jsonwebtoken = require("jsonwebtoken");
const Creator = require("../models/Creator");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../utils/catchAsyncErrors");

// Checks if user is authenticated or not
exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.headers;

  if (!token) {
    return next(
      new ErrorHandler("You must be logged in to access this feature", 400)
    );
  }

  jsonwebtoken.verify(
    token,
    process.env.JWT_SECRET,
    {
      ignoreExpiration: false,
    },
    async function (err, decoded) {
      if (err) {
        console.log(err);
        return next(new ErrorHandler(err.message, 400));
      }
      let user;
      if (req.query.password) {
        user = await Creator.findById(decoded.id).select("+password");
      } else {
        user = await Creator.findById(decoded.id).populate(
          "messages.transaction"
        );
      }
      // .populate(
      //   "messages.transaction"
      // );

      if (!user) {
        return next(new ErrorHandler("User does not exist", 400));
      }

      req.user = user;
      // req.new_token = user.getJwtToken();

      next();
    }
  );
});

// Check if user is authorized for this feature

exports.isAuthorized = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler("You are not authorized to use this feature", 403)
      );
    }
    next();
  };
};
