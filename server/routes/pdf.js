const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfController');
const auth = require('../middleware/auth');

// @route   GET api/pdf/room/:room_id/:exam_id
// @desc    Generate Room Invigilator PDF
// @access  Private
router.get('/room/:room_id/:exam_id', auth, pdfController.generateRoomPDF);

// @route   GET api/pdf/student/:student_id/:exam_id
// @desc    Generate Student Hall Ticket PDF
// @access  Private
router.get('/student/:student_id/:exam_id', auth, pdfController.generateStudentPDF);

// @route   GET api/pdf/master/:exam_id
// @desc    Generate Master Hall Arrangement PDF
// @access  Private
router.get('/master/:exam_id', auth, pdfController.generateMasterArrangementPDF);

module.exports = router;
