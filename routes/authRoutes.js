const express = require("express");
const {
  createCreator,
  completeCreatorAccount,
  creatorLogin,
  checkUsername,
  getTwitterReqToken,
  getTwitterAccessToken,
  verifyGoogle,
} = require("../controllers/auth");

const router = express.Router();

router.route("/creator").post(createCreator);
router.route("/creator/:username").get(checkUsername);
router.route("/creator").put(completeCreatorAccount);
router.route("/creator/login").post(creatorLogin);
router.route("/twitter").get(getTwitterReqToken).post(getTwitterAccessToken);
router.route("/google").post(verifyGoogle);

module.exports = router;
