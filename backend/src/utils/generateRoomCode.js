const Room = require('../models/Room');

const generateRoomCode = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let isUnique = false;
  let code = '';

  while (!isUnique) {
    code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Check if code exists in database
    const existingRoom = await Room.findOne({ roomCode: code });
    if (!existingRoom) {
      isUnique = true;
    }
  }

  return code;
};

module.exports = generateRoomCode;
