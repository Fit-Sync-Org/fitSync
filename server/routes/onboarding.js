const express      = require("express");
const router       = express.Router();
const requireAuth  = require("../middleware/requireAuth");
const onboardingController = require("../controllers/onboardingController");

router.post("/complete", requireAuth, onboardingController.completeOnboarding);

module.exports = router;
