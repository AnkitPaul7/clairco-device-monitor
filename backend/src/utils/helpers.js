function toPlainObject(record) {
  if (!record) {
    return record;
  }

  if (typeof record.toJSON === 'function') {
    return record.toJSON();
  }

  if (typeof record.toObject === 'function') {
    return record.toObject();
  }

  return record;
}

function calculateDeviceStatus(device, now = new Date()) {
  const plainDevice = toPlainObject(device);

  if (!plainDevice) {
    return null;
  }

  const lastHeartbeat = plainDevice.lastHeartbeat;
  const expectedInterval = Number(plainDevice.expectedInterval);

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

  const id = plainDevice.id || plainDevice._id;

  return {
    id: id ? String(id) : undefined,
    deviceId: plainDevice.deviceId,
    name: plainDevice.name,
    expectedInterval: plainDevice.expectedInterval,
    lastHeartbeat: plainDevice.lastHeartbeat,
    isActive: plainDevice.isActive,
    metadata: plainDevice.metadata || {},
    createdAt: plainDevice.createdAt,
    updatedAt: plainDevice.updatedAt,
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
