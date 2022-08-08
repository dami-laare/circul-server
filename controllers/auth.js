const axios = require("axios");
const crypto = require("crypto");
const OAuth = require("oauth");
const validator = require("validator");
const { OAuth2Client } = require("google-auth-library");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const sendJwt = require("../utils/sendJwt");
const Creator = require("../models/Creator");
const ErrorHandler = require("../utils/ErrorHandler");
require("dotenv").config();

const oauth = new OAuth.OAuth(
  "https://api.twitter.com/oauth/request_token",
  "https://api.twitter.com/oauth/access_token",
  process.env.TWITTER_ACCESS_KEY,
  process.env.TWITTER_ACCESS_TOKEN_SECRET,
  "1.0A",
  process.env.TWITTER_CALLBACK_URL,
  "HMAC-SHA1"
);

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_DEV_REDIRECT_URI
);

exports.createCreator = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Incomplete parameters", 400));
  }

  const existingCreator = await Creator.findOne({ email });

  if (existingCreator && existingCreator.profile_complete) {
    return next(new ErrorHandler("User already exists", 400));
  }

  if (
    !validator.isStrongPassword(password, {
      pointsPerUnique: 0,
      pointsPerRepeat: 0,
    })
  ) {
    return next(new ErrorHandler("Password is not valid", 400));
  }
  const token = await crypto.randomBytes(20).toString("hex");

  if (existingCreator) {
    existingCreator.token = await crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    await existingCreator.save();

    res.status(200).json({
      success: true,
      token,
      profileComplete: false,
    });
  } else {
    const creator = await Creator.create({
      email,
      password,
    });
    creator.token = await crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    await creator.save();

    res.status(200).json({
      success: true,
      token,
    });
  }
});

exports.checkUsername = catchAsyncErrors(async (req, res, next) => {
  const { username } = req.params;

  const exists = await Creator.findOne({ username });

  const reserved = [
    "dashboard",
    "messages",
    "profile",
    "welcome",
    "roles",
    "login",
    "sign-up",
    "username",
    "bio",
    "bank",
    "success",
    "",
  ];

  const invalid =
    !/^[A-Za-z0-9._~()'!*:@,;+-]*$/g.test(username) ||
    reserved.includes(username);

  if (exists || invalid) {
    return next(new ErrorHandler("Username not available", 400));
  }

  res.status(200).json({
    success: true,
  });
});

exports.completeCreatorAccount = catchAsyncErrors(async (req, res, next) => {
  let { token, imageUrl, bio, username, bank_details } = req.body;

  token = await crypto.createHash("sha256").update(token).digest("hex");

  const creator = await Creator.findOne({ token });

  if (!creator) {
    return next(new ErrorHandler("User does not exist", 400));
  }

  creator.username = username;
  creator.imageUrl = imageUrl;
  creator.bio = bio;
  creator.bank_details = bank_details;
  creator.profile_complete = true;
  creator.token = null;

  const response = await axios.post(
    "https://api.paystack.co/subaccount",
    {
      business_name: username,
      settlement_bank: bank_details.code,
      account_number: bank_details.account_number,
      percentage_charge: 0.1,
      description: `Circul subaccount for ${username}`,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  creator.bank_details.subaccount_code = response.data.data.subaccount_code;

  await creator.save();
  sendJwt(creator, 200, res);
});

exports.creatorLogin = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  const creator = await Creator.findOne({ email }).select("+password");

  if (!creator) {
    return next(new ErrorHandler("User does not exist", 400));
  }

  const isPasswordMatched = creator.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid password", 400));
  }

  if (!creator.profile_complete) {
    const token = await crypto.randomBytes(20).toString("hex");

    creator.token = await crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    await creator.save();

    res.status(200).json({
      success: true,
      token,
      profileComplete: false,
    });
  } else {
    sendJwt(creator, 200, res);
  }
});

exports.getTwitterReqToken = catchAsyncErrors(async (req, res, next) => {
  await oauth.getOAuthRequestToken(async (err, oauth_token, oauth_secret) => {
    if (err) {
      return next(
        new ErrorHandler(JSON.parse(err.data).errors[0].message),
        err.statusCode
      );
    }
    await Creator.create({
      twitterData: {
        oauth_token,
        oauth_secret,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        oauth_token,
        oauth_secret,
      },
    });
  });
});

exports.getTwitterAccessToken = catchAsyncErrors(async (req, res, next) => {
  const { oauth_token, oauth_secret, oauth_verifier } = req.body;

  const creator = await Creator.findOne({
    "twitterData.oauth_token": oauth_token,
  });

  if (!creator) {
    return next(new ErrorHandler("Login failed: Invalid oauth token", 400));
  }

  if (creator.twitterData.oauth_secret !== oauth_secret) {
    return next(new ErrorHandler("Login failed: oauth_secret mismatch", 400));
  }

  oauth.getOAuthAccessToken(
    oauth_token,
    oauth_secret,
    oauth_verifier,
    async (err, access_token, access_token_secret) => {
      if (err) {
        return next(
          new ErrorHandler(JSON.parse(err.data).errors[0].message),
          err.statusCode
        );
      }

      creator.twitterData.access_token = access_token;
      creator.twitterData.access_token_secret = access_token_secret;

      await oauth.getProtectedResource(
        "https://api.twitter.com/1.1/account/verify_credentials.json",
        "GET",
        access_token,
        access_token_secret,
        async (err, data, response) => {
          if (err) {
            return next(
              new ErrorHandler(JSON.parse(err.data).errors[0].message),
              err.statusCode
            );
          }
          console.log("data", data);
          console.log("response", response);
          res.status(200).json({
            success: true,
            data,
            response,
          });
        }
      );
    }
  );
});

exports.verifyGoogle = catchAsyncErrors(async (req, res, next) => {
  const { idToken } = req.body;
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const data = ticket.getPayload();

  const { name, profile, picture, sub } = ticket.getPayload();

  const userData = {
    name,
    profile,
    picture,
    sub,
  };

  console.log(userData);

  res.status(200).json({
    success: true,
    data,
  });
});
