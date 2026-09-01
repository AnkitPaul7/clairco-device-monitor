const compression = require('compression');
const cors = require('cors');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoose = require('mongoose');
const routes = require('./routes');
const logger = require('./utils/logger');

const MONGOOSE_READY_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
};

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000
  })
);

app.get('/health', (req, res) => {
  const dbState = MONGOOSE_READY_STATES[mongoose.connection.readyState] || 'unknown';
  const isHealthy = mongoose.connection.readyState === 1;

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'ok' : 'degraded',
    database: dbState,
    timestamp: new Date().toISOString()
  });
});

app.get('/metrics', (req, res) => {
  res.status(200).json({
    success: true,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    logger.error('Unhandled request error', {
      message: error.message,
      path: req.path,
      stack: error.stack
    });
  }

  return res.status(statusCode).json({
    success: false,
    message: error.statusCode ? error.message : 'Internal server error'
  });
});

module.exports = app;
