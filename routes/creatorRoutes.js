const express = require("express");
const {
  getCreatorDashDetails,
  updateProfile,
  changePassword,
  updateBankDetails,
  updateProfileImg,
  getFanPageDetails,
  sendTip,
  readMessage,
  analytics,
  getCreators,
} = require("../controllers/creatorControllers");
const { isAuthenticated } = require("../middleware/auth");

const router = express.Router();

router.route("/creator").get(isAuthenticated, getCreatorDashDetails);
router.route("/creators").get(getCreators);
router.route("/creator/fan_page/:username").get(getFanPageDetails);
router.route("/creator/fan_page/tip").post(sendTip);
router.route("/creator/profile").put(isAuthenticated, updateProfile);
router.route("/creator/password").put(isAuthenticated, changePassword);
router.route("/creator/bank").put(isAuthenticated, updateBankDetails);
router.route("/creator/image").put(isAuthenticated, updateProfileImg);
router.route("/creator/message/read").put(isAuthenticated, readMessage);
router.route("/creator/analytics/:username").put(analytics);

module.exports = router;
