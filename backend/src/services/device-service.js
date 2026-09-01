const { mongoose, Device } = require('../models');
const { createError, formatDeviceListResponse, formatDeviceResponse } = require('../utils/helpers');
const { sanitizeDeviceInput } = require('../utils/validators');

function buildDeviceLookup(identifier, includeInactive = false) {
  const or = [{ deviceId: identifier }];

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    or.push({ _id: identifier });
  }

  const filter = { $or: or };

  if (!includeInactive) {
    filter.isActive = true;
  }

  return filter;
}

function isDuplicateDeviceError(error) {
  return error && error.code === 11000;
}

async function getAllDevices(options = {}) {
  const filter = {};

  if (!options.includeInactive) {
    filter.isActive = true;
  }

  const devices = await Device.find(filter).sort({ createdAt: -1 });
  return formatDeviceListResponse(devices);
}

async function getDeviceById(id) {
  const device = await Device.findOne(buildDeviceLookup(id));

  if (!device) {
    throw createError('Device not found', 404);
  }

  return formatDeviceResponse(device);
}

async function ensureDeviceIdIsUnique(deviceId, existingId = null) {
  if (!deviceId) {
    return;
  }

  const existingDevice = await Device.findOne({ deviceId });

  if (!existingDevice) {
    return;
  }

  const existingObjectId = existingDevice.id || existingDevice._id;
  if (existingId && String(existingObjectId) === String(existingId)) {
    return;
  }

  throw createError('Device ID already exists', 409);
}

async function createDevice(data) {
  const payload = sanitizeDeviceInput(data);
  await ensureDeviceIdIsUnique(payload.deviceId);

  try {
    const device = await Device.create({
      deviceId: payload.deviceId,
      name: payload.name,
      expectedInterval: payload.expectedInterval,
      metadata: payload.metadata || {}
    });

    return formatDeviceResponse(device);
  } catch (error) {
    if (isDuplicateDeviceError(error)) {
      throw createError('Device ID already exists', 409);
    }

    throw error;
  }
}

async function updateDevice(id, data) {
  const device = await Device.findOne(buildDeviceLookup(id));

  if (!device) {
    throw createError('Device not found', 404);
  }

  const payload = sanitizeDeviceInput(data);
  if (payload.deviceId && payload.deviceId !== device.deviceId) {
    await ensureDeviceIdIsUnique(payload.deviceId, device.id || device._id);
  }

  Object.assign(device, payload);
  await device.save();

  return formatDeviceResponse(device);
}

async function deleteDevice(id) {
  const device = await Device.findOne(buildDeviceLookup(id));

  if (!device) {
    throw createError('Device not found', 404);
  }

  device.isActive = false;
  await device.save();

  return formatDeviceResponse(device);
}

async function updateHeartbeat(deviceId, options = {}) {
  const now = options.timestamp ? new Date(options.timestamp) : new Date();
  let device = await Device.findOne({
    deviceId,
    isActive: true
  });

  if (!device) {
    if (!options.autoCreate) {
      throw createError('Device not found', 404);
    }

    device = await Device.create({
      deviceId,
      name: options.name || deviceId,
      expectedInterval: options.defaultExpectedInterval || 60,
      lastHeartbeat: now,
      metadata: options.metadata || {}
    });

    return formatDeviceResponse(device, now);
  }

  device.lastHeartbeat = now;
  await device.save();

  const formattedDevice = formatDeviceResponse(device, now);

  try {
    const alertService = require('./alert-service');
    await alertService.resolveActiveAlertForDevice(deviceId, {
      device: formattedDevice,
      resolvedAt: now,
      sendRecoveryEmail: process.env.SEND_RECOVERY_EMAILS === 'true'
    });
  } catch (error) {
    console.error(`Failed to auto-resolve alert for ${deviceId}`, error);
  }

  return formattedDevice;
}

module.exports = {
  createDevice,
  deleteDevice,
  getAllDevices,
  getDeviceById,
  updateHeartbeat,
  updateDevice
};
