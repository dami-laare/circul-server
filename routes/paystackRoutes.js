const express = require("express");
const {
  getCountries,
  getBanks,
  webhook,
} = require("../controllers/paystackControllers");

const router = express.Router();

router.route("/paystack/countries").get(getCountries);
router.route("/paystack/banks/:country").get(getBanks);
router.route("/paystack/webhook").post(webhook);

module.exports = router;
