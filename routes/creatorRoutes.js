const express = require("express");
const {
  getCreatorDashDetails,
  updateProfile,
  changePassword,
  updateBankDetails,
} = require("../controllers/creatorControllers");
const { isAuthenticated } = require("../middleware/auth");

const router = express.Router();

router.route("/creator").get(isAuthenticated, getCreatorDashDetails);
router.route("/creator").put(isAuthenticated, updateProfile);
router.route("/creator/password").put(isAuthenticated, changePassword);
router.route("/creator/bank").put(isAuthenticated, updateBankDetails);

module.exports = router;
