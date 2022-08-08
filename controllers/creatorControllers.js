// const axios = require("axios");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
// const crypto = require("crypto");
const validator = require("validator");
const sendJwt = require("../utils/sendJwt");
const Creator = require("../models/Creator");
const ErrorHandler = require("../utils/ErrorHandler");

exports.getCreatorDashDetails = catchAsyncErrors(async (req, res, next) => {
  const creator = req.user;

  if (creator.firstSignUp) {
    creator.firstSignUp = false;

    await creator.save();
  }

  sendJwt(creator, 200, res, true);
});

exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const creator = req.user;

  const { user } = req.body;

  if (user.username !== creator.username) {
    const userExists = await Creator.findOne({ username: user.username });

    if (userExists) {
      return next(new ErrorHandler("Username not available", 400));
    }
  }

  if (user.email !== creator.email) {
    const userExists = await Creator.findOne({ email: user.email });

    if (userExists) {
      return next(
        new ErrorHandler(
          "A user with that email already exists. Please use another.",
          400
        )
      );
    }
  }

  Object.keys(user).forEach((el) => {
    creator[el] = user[el];
  });

  await creator.save();

  sendJwt(creator, 200, res);
});

exports.changePassword = catchAsyncErrors(async (req, res, next) => {
  const creator = req.user;

  const { new_password, confirm_password, old_password } = req.body;

  const isPasswordMatched = await creator.comparePassword(old_password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Incorrect old password", 400));
  }

  if (new_password !== confirm_password) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  if (
    !validator.isStrongPassword(new_password, {
      pointsPerUnique: 0,
      pointsPerRepeat: 0,
    })
  ) {
    return next(new ErrorHandler("Password is not valid", 400));
  }

  creator.password = new_password;

  await creator.save();

  sendJwt(creator, 200, res);
});

exports.updateBankDetails = catchAsyncErrors(async (req, res, next) => {
  const creator = req.user;

  const { bankDetails } = req.body;

  creator.bank_details = bankDetails;

  await creator.save();

  sendJwt(creator, 200, res);
});

exports.updateProfileImg = catchAsyncErrors(async (req, res, next) => {
  const creator = req.user;

  creator.imageUrl = req.body.imageUrl;

  await creator.save();

  sendJwt(creator, 200, res);
});
