require('dotenv').config();

const { startAlertScheduler, stopAlertScheduler } = require('../services/alert-scheduler');

const scheduler = startAlertScheduler();

function shutdown() {
  stopAlertScheduler();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = scheduler;
