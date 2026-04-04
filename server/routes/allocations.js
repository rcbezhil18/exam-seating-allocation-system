const express = require('express');
const router = express.Router();
const allocationController = require('../controllers/allocationController');
const auth = require('../middleware/auth');

// @route   POST api/allocations/generate/:exam_id
// @desc    Generate seating arrangement
// @access  Private
router.post('/generate/:exam_id', auth, allocationController.generateAllocations);

// @route   GET api/allocations/student/me
// @desc    Get allocations for the logged in student
// @access  Private
router.get('/student/me', auth, allocationController.getStudentAllocations);

// @route   GET api/allocations/:exam_id
// @desc    Get allocations for an exam
// @access  Private
router.get('/:exam_id', auth, allocationController.getAllocations);

module.exports = router;
