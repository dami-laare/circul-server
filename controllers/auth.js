const axios = require("axios");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const crypto = require("crypto");
const sendJwt = require("../utils/sendJwt");
const Creator = require("../models/Creator");
const ErrorHandler = require("../utils/ErrorHandler");

exports.createCreator = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Incomplete parameters", 400));
  }

  const existingCreator = await Creator.findOne({ email });

  if (existingCreator) {
    return next(new ErrorHandler("User already exists", 400));
  }

  const creator = await Creator.create({
    email,
    password,
  });

  const token = await crypto.randomBytes(20).toString("hex");

  creator.token = await crypto.createHash("sha256").update(token).digest("hex");

  await creator.save();

  res.status(200).json({
    success: true,
    token,
  });
});

exports.checkUsername = catchAsyncErrors(async (req, res, next) => {
  const { username } = req.params;

  const exists = await Creator.findOne({ username });

  if (exists) {
    return next(new ErrorHandler("User already exists", 400));
  }

  res.status(200).json({
    success: true,
  });
});

exports.completeCreatorAccount = catchAsyncErrors(async (req, res, next) => {
  let { token, imageUrl, bio, username, bankDetails } = req.body;

  token = await crypto.createHash("sha256").update(token).digest("hex");

  const creator = await Creator.findOne({ token });

  if (!creator) {
    return next(new ErrorHandler("User does not exist", 400));
  }

  creator.username = username;
  creator.imageUrl = imageUrl;
  creator.bio = bio;
  creator.bankDetails = bankDetails;

  creator.token = null;

  await creator.save();

  sendJwt(creator, 200, res);
});

exports.creatorLogin = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  const creator = await Creator.findOne({ email }).select("+password");

  const isPasswordMatched = creator.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid password", 400));
  }

  sendJwt(creator, 200, res);
});
