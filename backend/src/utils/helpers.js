function toPlainObject(record) {
  if (!record) {
    return record;
  }

  if (typeof record.get === 'function') {
    return record.get({ plain: true });
  }

  if (typeof record.toJSON === 'function') {
    return record.toJSON();
  }

  return record;
}

function getValue(record, camelKey, snakeKey) {
  return record[camelKey] !== undefined ? record[camelKey] : record[snakeKey];
}

function calculateDeviceStatus(device, now = new Date()) {
  const plainDevice = toPlainObject(device);

  if (!plainDevice) {
    return null;
  }

  const lastHeartbeat = getValue(plainDevice, 'lastHeartbeat', 'last_heartbeat');
  const expectedInterval = Number(getValue(plainDevice, 'expectedInterval', 'expected_interval'));

  if (!lastHeartbeat) {
    return 'pending';
  }

  const heartbeatTime = new Date(lastHeartbeat).getTime();
  if (Number.isNaN(heartbeatTime) || !Number.isFinite(expectedInterval)) {
    return 'pending';
  }

  const elapsedSeconds = (now.getTime() - heartbeatTime) / 1000;
  return elapsedSeconds <= expectedInterval ? 'online' : 'offline';
}

function formatDeviceResponse(device, now = new Date()) {
  const plainDevice = toPlainObject(device);

  if (!plainDevice) {
    return null;
  }

  return {
    ...plainDevice,
    status: calculateDeviceStatus(plainDevice, now)
  };
}

function formatDeviceListResponse(devices, now = new Date()) {
  return devices.map((device) => formatDeviceResponse(device, now));
}

function createError(message, statusCode = 500, details = undefined) {
  const error = new Error(message);
  error.statusCode = statusCode;

  if (details) {
    error.details = details;
  }

  return error;
}

module.exports = {
  calculateDeviceStatus,
  createError,
  formatDeviceListResponse,
  formatDeviceResponse,
  toPlainObject
};
