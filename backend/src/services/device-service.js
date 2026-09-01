const { Op } = require('sequelize');
const { Device } = require('../models');
const {
  createError,
  formatDeviceListResponse,
  formatDeviceResponse
} = require('../utils/helpers');
const { sanitizeDeviceInput } = require('../utils/validators');

function buildDeviceLookup(id) {
  return {
    [Op.or]: [
      { id },
      { deviceId: id }
    ]
  };
}

function isDuplicateDeviceError(error) {
  return (
    error &&
    (error.name === 'SequelizeUniqueConstraintError' ||
      error.name === 'SequelizeValidationError' ||
      error.original?.code === '23505')
  );
}

async function getAllDevices(options = {}) {
  const where = {};

  if (!options.includeInactive) {
    where.isActive = true;
  }

  const devices = await Device.findAll({
    where,
    order: [['createdAt', 'DESC']]
  });

  return formatDeviceListResponse(devices);
}

async function getDeviceById(id) {
  const device = await Device.findOne({
    where: buildDeviceLookup(id)
  });

  if (!device || device.isActive === false) {
    throw createError('Device not found', 404);
  }

  return formatDeviceResponse(device);
}

async function ensureDeviceIdIsUnique(deviceId, existingId = null) {
  if (!deviceId) {
    return;
  }

  const existingDevice = await Device.findOne({
    where: { deviceId }
  });

  if (!existingDevice) {
    return;
  }

  if (existingId && String(existingDevice.id) === String(existingId)) {
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
  const device = await Device.findOne({
    where: buildDeviceLookup(id)
  });

  if (!device || device.isActive === false) {
    throw createError('Device not found', 404);
  }

  const payload = sanitizeDeviceInput(data);
  if (payload.deviceId && payload.deviceId !== device.deviceId) {
    await ensureDeviceIdIsUnique(payload.deviceId, device.id);
  }

  await device.update(payload);

  return formatDeviceResponse(device);
}

async function deleteDevice(id) {
  const device = await Device.findOne({
    where: buildDeviceLookup(id)
  });

  if (!device || device.isActive === false) {
    throw createError('Device not found', 404);
  }

  await device.update({ isActive: false });

  return formatDeviceResponse(device);
}

async function updateHeartbeat(deviceId, options = {}) {
  const now = options.timestamp ? new Date(options.timestamp) : new Date();
  const device = await Device.findOne({
    where: {
      deviceId,
      isActive: true
    }
  });

  if (!device) {
    if (!options.autoCreate) {
      throw createError('Device not found', 404);
    }

    const createdDevice = await Device.create({
      deviceId,
      name: options.name || deviceId,
      expectedInterval: options.defaultExpectedInterval || 60,
      lastHeartbeat: now,
      metadata: options.metadata || {}
    });

    return formatDeviceResponse(createdDevice, now);
  }

  await device.update({ lastHeartbeat: now });

  try {
    const alertService = require('./alert-service');
    await alertService.resolveActiveAlertForDevice(deviceId, {
      device: formatDeviceResponse(device, now),
      resolvedAt: now,
      sendRecoveryEmail: process.env.SEND_RECOVERY_EMAILS === 'true'
    });
  } catch (error) {
    console.error(`Failed to auto-resolve alert for ${deviceId}`, error);
  }

  return formatDeviceResponse(device, now);
}

module.exports = {
  createDevice,
  deleteDevice,
  getAllDevices,
  getDeviceById,
  updateHeartbeat,
  updateDevice
};
