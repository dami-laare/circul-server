const axios = require("axios");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const crypto = require("crypto");
const sendJwt = require("../utils/sendJwt");
const Creator = require("../models/Creator");
const ErrorHandler = require("../utils/ErrorHandler");

exports.getCreatorDashDetails = catchAsyncErrors(async (req, res, next) => {
  const creator = req.user;

  sendJwt(creator, 200, res, true);
});
