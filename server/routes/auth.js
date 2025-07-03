const express = require('express');
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const authController = require("../controllers/authController");

router.post("/firebase-login", authController.firebaseLogin);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);

module.exports = router;
