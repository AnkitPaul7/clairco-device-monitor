const deviceValidationRules = {
  deviceId: {
    required: true,
    pattern: /^[a-zA-Z0-9\-_]+$/,
    minLength: 1,
    maxLength: 50,
    message: 'Device ID must contain only letters, numbers, hyphens, and underscores'
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    message: 'Name must be between 2 and 100 characters'
  },
  expectedInterval: {
    required: true,
    min: 5,
    max: 86400,
    message: 'Expected interval must be between 5 and 86400 seconds'
  }
};

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function validateDeviceId(deviceId, errors) {
  if (!hasValue(deviceId)) {
    errors.push('Device ID is required');
    return;
  }

  const value = String(deviceId).trim();
  if (!deviceValidationRules.deviceId.pattern.test(value)) {
    errors.push(deviceValidationRules.deviceId.message);
  } else if (value.length > deviceValidationRules.deviceId.maxLength) {
    errors.push('Device ID must be at most 50 characters');
  }
}

function validateName(name, errors) {
  if (!hasValue(name)) {
    errors.push('Device name is required');
    return;
  }

  const value = String(name).trim();
  if (value.length < deviceValidationRules.name.minLength) {
    errors.push('Device name must be at least 2 characters');
  } else if (value.length > deviceValidationRules.name.maxLength) {
    errors.push('Device name must be at most 100 characters');
  }
}

function validateExpectedInterval(expectedInterval, errors) {
  if (!hasValue(expectedInterval)) {
    errors.push('Expected interval is required');
    return;
  }

  const interval = Number(expectedInterval);
  if (
    !Number.isInteger(interval) ||
    interval < deviceValidationRules.expectedInterval.min ||
    interval > deviceValidationRules.expectedInterval.max
  ) {
    errors.push(deviceValidationRules.expectedInterval.message);
  }
}

function validateDeviceInput(data = {}) {
  const errors = [];

  validateDeviceId(data.deviceId, errors);
  validateName(data.name, errors);
  validateExpectedInterval(data.expectedInterval, errors);

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateDeviceUpdateInput(data = {}) {
  const errors = [];
  const allowedFields = ['deviceId', 'name', 'expectedInterval', 'metadata', 'isActive'];
  const providedFields = Object.keys(data).filter((field) => allowedFields.includes(field));

  if (providedFields.length === 0) {
    errors.push('At least one device field is required');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'deviceId')) {
    validateDeviceId(data.deviceId, errors);
  }

  if (Object.prototype.hasOwnProperty.call(data, 'name')) {
    validateName(data.name, errors);
  }

  if (Object.prototype.hasOwnProperty.call(data, 'expectedInterval')) {
    validateExpectedInterval(data.expectedInterval, errors);
  }

  if (
    Object.prototype.hasOwnProperty.call(data, 'metadata') &&
    (typeof data.metadata !== 'object' || data.metadata === null || Array.isArray(data.metadata))
  ) {
    errors.push('Metadata must be an object');
  }

  if (
    Object.prototype.hasOwnProperty.call(data, 'isActive') &&
    typeof data.isActive !== 'boolean'
  ) {
    errors.push('isActive must be a boolean');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function sanitizeDeviceInput(data = {}) {
  const sanitized = {};

  if (Object.prototype.hasOwnProperty.call(data, 'deviceId')) {
    sanitized.deviceId = String(data.deviceId).trim();
  }

  if (Object.prototype.hasOwnProperty.call(data, 'name')) {
    sanitized.name = String(data.name).trim();
  }

  if (Object.prototype.hasOwnProperty.call(data, 'expectedInterval')) {
    sanitized.expectedInterval = Number(data.expectedInterval);
  }

  if (Object.prototype.hasOwnProperty.call(data, 'metadata')) {
    sanitized.metadata = data.metadata;
  }

  if (Object.prototype.hasOwnProperty.call(data, 'isActive')) {
    sanitized.isActive = data.isActive;
  }

  return sanitized;
}

module.exports = {
  deviceValidationRules,
  validateDeviceInput,
  validateDeviceUpdateInput,
  sanitizeDeviceInput
};
