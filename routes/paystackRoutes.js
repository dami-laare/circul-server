const express = require("express");
const {
  getCountries,
  getBanks,
} = require("../controllers/paystackControllers");

const router = express.Router();

router.route("/paystack/countries").get(getCountries);
router.route("/paystack/banks/:country").get(getBanks);

module.exports = router;
