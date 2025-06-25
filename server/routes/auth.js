const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');


router.post("/firebase-login", authController.firebaseLogin);
// router.post('/register', authController.register);
// router.post("/login", authController.login);


module.exports = router;
