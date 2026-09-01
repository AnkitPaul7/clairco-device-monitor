require('dotenv').config();

const http = require('http');
const app = require('./app');
const { initializeSocket } = require('./services/socket-service');
const { startMqttListener, stopMqttListener } = require('./services/mqtt-listener');
const { startAlertScheduler, stopAlertScheduler } = require('./services/alert-scheduler');

const port = process.env.PORT || 5000;
const server = http.createServer(app);

initializeSocket(server);
startMqttListener();
startAlertScheduler();

server.listen(port, () => {
  console.log(`Clairco Device Monitoring API listening on port ${port}`);
});

function shutdown() {
  stopMqttListener();
  stopAlertScheduler();
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = server;
