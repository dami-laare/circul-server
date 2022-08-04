const express = require("express");
const { getCreatorDashDetails } = require("../controllers/creatorControllers");
const { isAuthenticated } = require("../middleware/auth");

const router = express.Router();

router.route("/creator").get(isAuthenticated, getCreatorDashDetails);

module.exports = router;
