const axios = require("axios");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
// const crypto = require("crypto");
const validator = require("validator");
const sendJwt = require("../utils/sendJwt");
const Creator = require("../models/Creator");
const Transaction = require("../models/Transaction");
const ErrorHandler = require("../utils/ErrorHandler");

exports.getCreatorDashDetails = catchAsyncErrors(async (req, res, next) => {
  const creator = req.user;

  if (creator.firstSignUp) {
    creator.firstSignUp = false;

    await creator.save();
  }

  sendJwt(creator, 200, res, true);
});

exports.getFanPageDetails = catchAsyncErrors(async (req, res, next) => {
  const creator = await Creator.findOne({
    username: req.params.username,
  }).select("username email_verified profileComplete bio imageUrl");

  if (!creator) {
    return next(new ErrorHandler("User does not exist", 400));
  }

  let transactionSuccess;

  if (req.query.ref) {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${req.query.ref}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (response.data.data.status === "success") {
      const transaction = await Transaction.findOne({ ref: req.query.ref });

      if (transaction.status !== "success") {
        transaction.status = "success";
        creator.total_earnings += transaction.earnings;
        await creator.save();
        await transaction.save();
      }

      transactionSuccess = true;
    } else {
      const transaction = await Transaction.findOne({ ref: req.query.ref });

      if (transaction.status === "success") {
        transactionSuccess = true;
      }
    }

    return res.status(200).json({
      success: true,
      creator,
      transactionSuccess,
    });
  }
  res.status(200).json({
    success: true,
    creator,
    transactionSuccess,
  });
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

  const { password, confirmPassword } = req.body;

  // const isPasswordMatched = await creator.comparePassword(old_password);

  // if (!isPasswordMatched) {
  //   return next(new ErrorHandler("Incorrect old password", 400));
  // }

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

  const { bank_details } = req.body;

  await axios.put(
    `https://api.paystack.co/subaccount/${creator.bank_details.subaccount_code}`,
    {
      settlement_bank: bank_details.code,
      account_number: bank_details.account_number,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  creator.bank_details = bank_details;

  await creator.save();

  sendJwt(creator, 200, res);
});

exports.updateProfileImg = catchAsyncErrors(async (req, res, next) => {
  const creator = req.user;

  creator.imageUrl = req.body.imageUrl;

  await creator.save();

  sendJwt(creator, 200, res);
});

exports.sendTip = catchAsyncErrors(async (req, res, next) => {
  const creator = await Creator.findOne({ username: req.body.username });

  if (!creator) {
    return next(new ErrorHandler("User does not exist", 400));
  }

  const response = await axios.post(
    "https://api.paystack.co/transaction/initialize",
    {
      email: req.body.email,
      amount: Number(req.body.amount) * 100,
      subaccount: creator.bank_details.subaccount_code,
      channels: ["card", "bank_transfer"],
      bearer: "subaccount",
      callback_url: `${process.env.FRONTEND_BASE_URL}/${creator.username}`,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  const transaction = await Transaction.create({
    amount: req.body.amount,
    fan: {
      nickname: req.body.name ? req.body.name : "anonymous",
      email: req.body.email,
    },
    creator: creator._id,
    ref: response.data.data.reference,
  });

  creator.messages.push({
    text: req.body.message,
    transaction: transaction._id,
  });

  creator.transactions.push(transaction._id);

  await creator.save();

  const data = {
    url: response.data.data.authorization_url,
    ref: response.data.data.reference,
  };

  res.status(200).json({
    success: true,
    data,
  });
});

exports.readMessage = catchAsyncErrors(async (req, res, next) => {
  const creator = req.user;

  let messageIndex;

  creator.messages.forEach((m, i) => {
    if (m._id.toString() === req.body.message) {
      messageIndex = i;
    }
  });

  creator.messages[messageIndex].read = true;

  await creator.save();

  res.status(200).json({
    success: true,
  });
});

exports.analytics = catchAsyncErrors(async (req, res, next) => {
  const user_agent = req.headers["user-agent"];

  const creator = await Creator.findOne({ username: req.params.username });

  if (!creator) {
    return next(new ErrorHandler("User does not exist", 400));
  }

  if (req.query.method === "view") {
    if (
      creator.analytics.page_views.length === 0 ||
      creator.analytics.page_views[0] === 0
    ) {
      if (!creator.analytics.page_views) {
        creator.analytics.page_views = [];
      }
      creator.analytics.page_views.pop();
      creator.analytics.page_views.push({
        user_agent,
      });
    } else {
      const filteredViews = creator.analytics.page_views.filter((v) => {
        v.user_agent === user_agent;
      });

      const mostRecentView = filteredViews[filteredViews.length - 1];

      const mostRecentViewTime = new Date(mostRecentView.date).getTime();

      if (filteredViews.length === 0) {
        creator.analytics.page_views.push({
          user_agent,
        });
      } else if (mostRecentViewTime - Date.now() > 900000) {
        creator.analytics.page_views.push({
          user_agent,
        });
      }
    }
  }

  if (req.query.method === "share") {
    if (
      creator.analytics.shares.length === 0 ||
      creator.analytics.shares[0] === 0
    ) {
      if (!creator.analytics.shares) {
        creator.analytics.shares = [];
      }
      creator.analytics.shares.pop();
      creator.analytics.shares.push({
        user_agent,
      });
    } else {
      const filteredShares = creator.analytics.shares.filter((v) => {
        v.user_agent === user_agent;
      });

      const mostRecentShare = filteredShares[filteredShares.length - 1];

      const mostRecentShareTime = new Date(mostRecentShare.date).getTime();

      if (filteredShares.length === 0) {
        creator.analytics.shares.push({
          user_agent,
        });
      } else if (mostRecentShareTime - Date.now() > 900000) {
        creator.analytics.shares.push({
          user_agent,
        });
      }
    }
  }

  await creator.save();

  res.status(200).json({
    success: true,
  });
});

// GET: /api/v1/creators
exports.getCreators = catchAsyncErrors(async (req, res, next) => {
  let creators;
  const limit = req.query.limit ? req.query.limit : 15;
  const page = req.query.page ? req.query.page : 15;

  switch (req.query.filter) {
    case "top":
      creators = await Creator.find().sort({ "messages.length": 1 }).limit(3);
      break;
    case "all":
      creators = await Creator.find()
        .limit(limit)
        .skip(page * limit);
      break;
    case "search":
      creators = await Creator.find({
        username: { $regex: `${req.query.searchQuery}`, $options: "gi" },
      })
        .limit(limit)
        .skip(page * limit);
      break;
    default:
      return next(new ErrorHandler("Missing query parameters", 400));
  }

  res.status(200).json({
    success: true,
    creators,
  });
});
