const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function connectDB(
  uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/clairco_monitor'
) {
  try {
    mongoose.set('strictQuery', true);
    const connection = await mongoose.connect(uri);
    logger.info(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
}

module.exports = connectDB;
