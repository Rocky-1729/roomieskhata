let io;

module.exports = {
  init: (server) => {
    const { Server } = require('socket.io');
    io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
      }
    });

    io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      socket.on('join_room', ({ roomId }) => {
        if (roomId) {
          socket.join(roomId.toString());
          console.log(`User socket ${socket.id} joined room: ${roomId}`);
        }
      });

      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });

    return io;
  },
  getIO: () => {
    return io;
  },
  emitToRoom: (roomId, event, data) => {
    if (io && roomId) {
      io.to(roomId.toString()).emit(event, data);
    }
  }
};
