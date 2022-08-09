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
  });

  if (req.body.message) {
    creator.messages.push({
      text: req.body.message,
      transaction: transaction._id,
    });
  }

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

  let messageIndex = creator.messages.map((m, i) => {
    if (m._id.toString() === req.body.message) {
      return i;
    }
  });

  creator.messages[messageIndex[0]].read = true;

  await creator.save();

  res.status(200).json({
    success: true,
  });
});
