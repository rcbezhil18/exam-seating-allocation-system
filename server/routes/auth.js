const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// @route   POST api/auth/login
// @desc    Authenticate admin & get token
// @access  Public
router.post('/login', authController.login);

// @route   POST api/auth/student-login
// @desc    Authenticate student & get token
// @access  Public
router.post('/student-login', authController.studentLogin);

module.exports = router;
