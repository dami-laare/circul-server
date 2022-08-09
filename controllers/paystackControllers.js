const axios = require("axios");
const Sentry = require("@sentry/node");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const capitalize = require("../utils/capitalize");
const Transaction = require("../models/Transaction");
const Creator = require("../models/Creator");
const secret_key = process.env.PAYSTACK_SECRET_KEY;

exports.getCountries = catchAsyncErrors(async (req, res, next) => {
  await axios
    .get("https://api.paystack.co/country", {
      headers: {
        Authorization: `Bearer ${secret_key}`,
      },
    })
    .then((response) => {
      res.status(200).json({
        success: true,
        countries: response.data.data,
      });
    })
    .catch((err) => {
      Sentry.captureException(err);
      return next(new ErrorHandler("An error occurred", 500));
    });
});

exports.getBanks = catchAsyncErrors(async (req, res, next) => {
  const country = req.params.country;

  await axios
    .get(`https://api.paystack.co/bank?country=${country}`, {
      headers: {
        Authorization: `Bearer ${secret_key}`,
      },
    })
    .then((response) => {
      res.status(200).json({
        success: true,
        banks: response.data.data,
      });
    })
    .catch((err) => {
      Sentry.captureException(err);
      return next(new ErrorHandler("An error occurred", 500));
    });
});

exports.webhook = catchAsyncErrors(async (req, res, next) => {
  if (req.body.event === "charge.success") {
    let transaction = await Transaction.findOne({
      ref: req.body.data.reference,
    });

    if (transaction.status !== "success") {
      transaction.status = "success";
      const creator = await Creator.findById(transaction.creator.toString());
      creator.total_earnings += Number(transaction.amount) * 0.9;

      await creator.save();
      await transaction.save();
    }

    res.status(200);
  }
});

// exports.saveAccDetails = catchAsyncErrors(async (req, res, next) => {
//   const mentor = req.user;

//   let { bank, accNo, country } = req.body;

//   if (!bank || !accNo || !country) {
//     return next(new ErrorHandler("An error occurred", 500));
//   }
//   const fullName = `${capitalize(mentor.firstName)} ${capitalize(
//     mentor.lastName
//   )}`;

//   const subaccountCode =
//     mentor.paystackBankDetails.subaccount_details.subaccount_code;

//   if (subaccountCode) {
//     await axios
//       .put(
//         `https://api.paystack.co/subaccount/${subaccountCode}`,
//         {
//           settlement_bank: bank.code,
//           account_number: accNo,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${secret_key}`,
//           },
//         }
//       )
//       .then(async () => {
//         mentor.paystackBankDetails.bank = bank;
//         mentor.paystackBankDetails.subaccount_details.accNo = accNo;

//         await mentor.save();

//         res.status(200).json({
//           success: true,
//         });
//       })
//       .catch((err) => {
//         console.log(err);
//         return next(new ErrorHandler("An error occurred", 500));
//       });
//   } else {
//     await axios
//       .post(
//         "https://api.paystack.co/subaccount",
//         {
//           business_name: fullName,
//           settlement_bank: bank.code,
//           account_number: accNo,
//           percentage_charge: 0.075,
//           description: `Oddience coach subaccount for ${fullName}`,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${secret_key}`,
//           },
//         }
//       )
//       .then(async (response) => {
//         const subaccount_details = {
//           business_name: fullName,
//           accNo,
//           subaccount_code: response.data.data.subaccount_code,
//         };
//         mentor.paystackBankDetails = {
//           bank,
//           country,
//           subaccount_details,
//         };

//         mentor.usingPaystack = true;

//         await mentor.save();

//         res.status(200).json({
//           success: true,
//         });
//       })
//       .catch((err) => {
//         console.log(err);
//         return next(new ErrorHandler("An error occurred", 500));
//       });
//   }
// });
