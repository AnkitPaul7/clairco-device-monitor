require('dotenv').config();

const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/database');
const { initializeSocket, closeSocket } = require('./services/socket-service');
const { startMqttListener, stopMqttListener } = require('./services/mqtt-listener');
const { startAlertScheduler, stopAlertScheduler } = require('./services/alert-scheduler');
const logger = require('./utils/logger');

const port = process.env.PORT || 5000;
const server = http.createServer(app);

async function startServer() {
  try {
    await connectDB();
    initializeSocket(server);

    server.listen(port, () => {
      logger.info(`Clairco Device Monitoring API listening on port ${port}`);
    });

    startMqttListener();
    startAlertScheduler();
  } catch (error) {
    logger.error('Failed to start server', { message: error.message });
    process.exit(1);
  }
}

function shutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully`);

  const forceExitTimer = setTimeout(() => {
    logger.warn('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  stopMqttListener();
  stopAlertScheduler();
  closeSocket();

  server.close(async () => {
    try {
      await mongoose.disconnect();
    } catch (error) {
      logger.error('Error disconnecting MongoDB during shutdown', { message: error.message });
    } finally {
      clearTimeout(forceExitTimer);
      process.exit(0);
    }
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : reason
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { message: error.message, stack: error.stack });
  process.exit(1);
});

startServer();

module.exports = server;
