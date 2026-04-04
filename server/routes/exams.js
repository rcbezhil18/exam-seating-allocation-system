const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const auth = require('../middleware/auth');

router.get('/', auth, examController.getExams);
router.post('/', auth, examController.createExam);
router.put('/:id', auth, examController.updateExam);
router.delete('/:id', auth, examController.deleteExam);
router.post('/upload', auth, examController.uploadExamsParams, examController.uploadExams);

module.exports = router;
