const { Server } = require('socket.io');

let ioInstance = null;

const initSocketServer = (httpServer, clientUrl) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        callback(null, true);
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  ioInstance.on('connection', (socket) => {
    socket.on('joinEvent', (eventId) => {
      if (eventId) {
        socket.join(`event:${eventId}`);
      }
    });

    socket.on('leaveEvent', (eventId) => {
      if (eventId) {
        socket.leave(`event:${eventId}`);
      }
    });

    socket.on('disconnect', () => {});
  });

  return ioInstance;
};

const getIO = () => {
  return ioInstance;
};

const broadcastSeatUpdate = (eventId, seatUpdates) => {
  if (!ioInstance) return;
  const updatesArray = Array.isArray(seatUpdates) ? seatUpdates : [seatUpdates];
  ioInstance.to(`event:${eventId}`).emit('seatUpdated', {
    eventId,
    seats: updatesArray
  });
};

module.exports = {
  initSocketServer,
  getIO,
  broadcastSeatUpdate
};
