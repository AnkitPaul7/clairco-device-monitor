const mongoose = require('mongoose');
const { validateDeviceInput, validateDeviceUpdateInput } = require('../utils/validators');

function sendValidationError(res, errors) {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors
  });
}

function validateCreateDevice(req, res, next) {
  const validation = validateDeviceInput(req.body);

  if (!validation.isValid) {
    return sendValidationError(res, validation.errors);
  }

  return next();
}

function validateUpdateDevice(req, res, next) {
  const validation = validateDeviceUpdateInput(req.body);

  if (!validation.isValid) {
    return sendValidationError(res, validation.errors);
  }

  return next();
}

function validateDeviceIdentifier(req, res, next) {
  if (!req.params.id || !String(req.params.id).trim()) {
    return sendValidationError(res, ['Device identifier is required']);
  }

  return next();
}

function validateAlertIdentifier(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return sendValidationError(res, ['Alert identifier is invalid']);
  }

  return next();
}

module.exports = {
  validateAlertIdentifier,
  validateCreateDevice,
  validateDeviceIdentifier,
  validateUpdateDevice
};
