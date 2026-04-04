const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const auth = require('../middleware/auth');

router.get('/', auth, roomController.getRooms);
router.post('/', auth, roomController.createRoom);
router.put('/:id', auth, roomController.updateRoom);
router.delete('/:id', auth, roomController.deleteRoom);
router.post('/upload', auth, roomController.uploadRoomsParams, roomController.uploadRooms);

module.exports = router;
