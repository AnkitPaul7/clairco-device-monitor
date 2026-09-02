const { Server } = require('socket.io');
const { corsOriginHandler } = require('../config/cors');

let io = null;

function initializeSocket(server, options = {}) {
  io = new Server(server, {
    cors: {
      origin: corsOriginHandler,
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    },
    ...options
  });

  io.on('connection', (socket) => {
    socket.emit('socket:connected', {
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  return io;
}

function getSocketServer() {
  return io;
}

function broadcastDeviceHeartbeat(device, telemetry = {}) {
  if (!io) {
    return false;
  }

  const payload = {
    device,
    telemetry,
    timestamp: new Date().toISOString()
  };

  io.emit('device:heartbeat', payload);
  io.emit('device:status', {
    deviceId: device.deviceId,
    status: device.status,
    device,
    timestamp: payload.timestamp
  });

  return true;
}

function emitToAll(eventName, payload) {
  if (!io) {
    return false;
  }

  io.emit(eventName, payload);
  return true;
}

function emitAlert(alert) {
  return emitToAll('alert:created', {
    alert,
    timestamp: new Date().toISOString()
  });
}

function closeSocket() {
  if (io) {
    io.close();
    io = null;
  }
}

module.exports = {
  broadcastDeviceHeartbeat,
  closeSocket,
  emitAlert,
  emitToAll,
  getSocketServer,
  initializeSocket
};
