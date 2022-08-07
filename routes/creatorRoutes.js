const express = require("express");
const {
  getCreatorDashDetails,
  updateProfile,
  changePassword,
  updateBankDetails,
  updateProfileImg,
} = require("../controllers/creatorControllers");
const { isAuthenticated } = require("../middleware/auth");

const router = express.Router();

router.route("/creator").get(isAuthenticated, getCreatorDashDetails);
router.route("/creator").put(isAuthenticated, updateProfile);
router.route("/creator/password").put(isAuthenticated, changePassword);
router.route("/creator/bank").put(isAuthenticated, updateBankDetails);
router.route("/creator/profile").put(isAuthenticated, updateProfileImg);

module.exports = router;
