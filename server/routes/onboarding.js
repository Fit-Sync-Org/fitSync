const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/requireAuth");
const verifyToken = require("../middleware/verifyToken");
const onboardingController = require("../controllers/onboardingController");

router.post("/complete", requireAuth, onboardingController.completeOnboarding);
router.post("/register", verifyToken, onboardingController.registerNewUser);

module.exports = router;
