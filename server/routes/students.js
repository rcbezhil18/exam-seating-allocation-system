const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const auth = require('../middleware/auth');

// @route   POST api/students/upload
router.post('/upload', auth, studentController.uploadStudentsParams, studentController.uploadStudents);

// @route   GET api/students/me
router.get('/me', auth, studentController.getMe);

// @route   GET api/students
router.get('/', auth, studentController.getStudents);

// @route   PUT api/students/:id
router.put('/:id', auth, studentController.updateStudent);

// @route   DELETE api/students/:id
router.delete('/:id', auth, studentController.deleteStudent);

// @route   POST api/students/pay
router.post('/pay', auth, studentController.payFee);

// @route   PUT api/students/verify-payment/:id
router.put('/verify-payment/:id', auth, studentController.verifyPayment);

module.exports = router;
