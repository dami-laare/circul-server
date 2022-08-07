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

  Object.keys(user).forEach((el) => {
    creator[el] = user[el];
  });

  await creator.save();

  sendJwt(creator, 200, res);
});

exports.changePassword = catchAsyncErrors(async (req, res, next) => {
  const creator = req.user;

  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  if (
    !validator.isStrongPassword(password, {
      pointsPerUnique: 0,
      pointsPerRepeat: 0,
    })
  ) {
    return next(new ErrorHandler("Password is not valid", 400));
  }

  creator.password = password;

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
