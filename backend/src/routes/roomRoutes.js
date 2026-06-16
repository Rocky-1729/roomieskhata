const express = require('express');
const {
  createRoom,
  joinRoom,
  getMyRoom,
  updateRoom,
  leaveRoom,
  deleteMyRoom,
} = require('../controllers/roomController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All room operations require authentication

router.post('/', createRoom);
router.post('/join', joinRoom);
router.get('/my-room', getMyRoom);
router.put('/my-room', updateRoom);
router.post('/leave', leaveRoom);
router.delete('/my-room', deleteMyRoom);

module.exports = router;
