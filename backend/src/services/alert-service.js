const { Alert, Device } = require('../models');
const emailService = require('./email-service');
const socketService = require('./socket-service');
const { calculateDeviceStatus, createError, toPlainObject } = require('../utils/helpers');

const ACTIVE_STATUS = 'active';
const RESOLVED_STATUS = 'resolved';
const ACKNOWLEDGED_STATUS = 'acknowledged';

function normalizeAlert(alert) {
  const plainAlert = toPlainObject(alert);

  if (!plainAlert) {
    return null;
  }

  return {
    id: plainAlert.id ? String(plainAlert.id) : String(plainAlert._id),
    deviceId: plainAlert.deviceId,
    triggeredAt: plainAlert.triggeredAt,
    resolvedAt: plainAlert.resolvedAt,
    message: plainAlert.message,
    emailSent: plainAlert.emailSent,
    status: plainAlert.status,
    createdAt: plainAlert.createdAt,
    updatedAt: plainAlert.updatedAt
  };
}

function getSecondsSinceLastHeartbeat(device, now = new Date()) {
  if (!device.lastHeartbeat) {
    return null;
  }

  return Math.max(0, Math.floor((now.getTime() - new Date(device.lastHeartbeat).getTime()) / 1000));
}

function buildAlertMessage(device, now = new Date()) {
  const secondsElapsed = getSecondsSinceLastHeartbeat(device, now);
  const elapsedText =
    secondsElapsed === null
      ? 'no heartbeat has been received'
      : `${secondsElapsed} seconds elapsed`;

  return `Device ${device.name} (${device.deviceId}) missed expected heartbeat interval of ${device.expectedInterval} seconds; ${elapsedText}.`;
}

async function getActiveAlertForDevice(deviceId) {
  return Alert.findOne({
    deviceId,
    status: ACTIVE_STATUS
  });
}

async function createAlertForDevice(device, options = {}) {
  const plainDevice = toPlainObject(device);
  const existingAlert = await getActiveAlertForDevice(plainDevice.deviceId);

  if (existingAlert) {
    return normalizeAlert(existingAlert);
  }

  const now = options.now || new Date();
  const alert = await Alert.create({
    deviceId: plainDevice.deviceId,
    triggeredAt: now,
    message: options.message || buildAlertMessage(plainDevice, now),
    status: ACTIVE_STATUS,
    emailSent: false
  });

  try {
    await emailService.sendAlertEmail(normalizeAlert(alert), plainDevice, {
      timeSinceLastHeartbeat: `${getSecondsSinceLastHeartbeat(plainDevice, now)} seconds`
    });
    alert.emailSent = true;
    await alert.save();
  } catch (error) {
    alert.emailSent = false;
    await alert.save();
    console.error(`Failed to send alert email for ${plainDevice.deviceId}`, error);
  }

  const createdAlert = normalizeAlert(alert);
  socketService.emitToAll('alert:created', {
    alert: createdAlert,
    timestamp: new Date().toISOString()
  });

  return createdAlert;
}

async function resolveActiveAlertForDevice(deviceId, options = {}) {
  const activeAlert = await getActiveAlertForDevice(deviceId);

  if (!activeAlert) {
    return null;
  }

  activeAlert.status = RESOLVED_STATUS;
  activeAlert.resolvedAt = options.resolvedAt || new Date();
  await activeAlert.save();

  const resolvedAlert = normalizeAlert(activeAlert);
  socketService.emitToAll('alert:resolved', {
    alert: resolvedAlert,
    timestamp: new Date().toISOString()
  });

  if (options.sendRecoveryEmail) {
    try {
      const device = options.device || (await Device.findOne({ deviceId }));
      if (device) {
        await emailService.sendRecoveryEmail(resolvedAlert, toPlainObject(device));
      }
    } catch (error) {
      console.error(`Failed to send recovery email for ${deviceId}`, error);
    }
  }

  return resolvedAlert;
}

async function acknowledgeAlert(id) {
  const alert = await Alert.findById(id);

  if (!alert) {
    throw createError('Alert not found', 404);
  }

  alert.status = ACKNOWLEDGED_STATUS;
  await alert.save();

  const acknowledgedAlert = normalizeAlert(alert);
  socketService.emitToAll('alert:acknowledged', {
    alert: acknowledgedAlert,
    timestamp: new Date().toISOString()
  });

  return acknowledgedAlert;
}

async function resolveAlert(id) {
  const alert = await Alert.findById(id);

  if (!alert) {
    throw createError('Alert not found', 404);
  }

  alert.status = RESOLVED_STATUS;
  alert.resolvedAt = new Date();
  await alert.save();

  const resolvedAlert = normalizeAlert(alert);
  socketService.emitToAll('alert:resolved', {
    alert: resolvedAlert,
    timestamp: new Date().toISOString()
  });

  return resolvedAlert;
}

async function getAlertById(id) {
  const alert = await Alert.findById(id);

  if (!alert) {
    throw createError('Alert not found', 404);
  }

  return normalizeAlert(alert);
}

function buildAlertFilters(query = {}) {
  const filter = {};

  if (query.deviceId && typeof query.deviceId === 'string') {
    filter.deviceId = query.deviceId;
  }

  if (query.status && typeof query.status === 'string') {
    filter.status = query.status;
  }

  if (query.from || query.to) {
    filter.triggeredAt = {};

    if (query.from) {
      filter.triggeredAt.$gte = new Date(query.from);
    }

    if (query.to) {
      filter.triggeredAt.$lte = new Date(query.to);
    }
  }

  return filter;
}

function toSafeInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

async function getAlerts(query = {}) {
  const page = Math.max(1, toSafeInteger(query.page, 1));
  const limit = Math.min(100, Math.max(1, toSafeInteger(query.limit, 20)));
  const skip = (page - 1) * limit;
  const filter = buildAlertFilters(query);

  const [rows, count] = await Promise.all([
    Alert.find(filter).sort({ triggeredAt: -1 }).skip(skip).limit(limit),
    Alert.countDocuments(filter)
  ]);

  return {
    data: rows.map(normalizeAlert),
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  };
}

async function getActiveAlertsCount() {
  return Alert.countDocuments({
    status: ACTIVE_STATUS
  });
}

async function getAlertStatistics() {
  const [total, active, resolved, acknowledged] = await Promise.all([
    Alert.countDocuments(),
    Alert.countDocuments({ status: ACTIVE_STATUS }),
    Alert.countDocuments({ status: RESOLVED_STATUS }),
    Alert.countDocuments({ status: ACKNOWLEDGED_STATUS })
  ]);

  return {
    total,
    active,
    resolved,
    acknowledged
  };
}

function isDeviceOffline(device, now = new Date()) {
  return calculateDeviceStatus(device, now) === 'offline';
}

module.exports = {
  ACTIVE_STATUS,
  ACKNOWLEDGED_STATUS,
  RESOLVED_STATUS,
  acknowledgeAlert,
  buildAlertMessage,
  createAlertForDevice,
  getActiveAlertForDevice,
  getActiveAlertsCount,
  getAlertById,
  getAlerts,
  getAlertStatistics,
  getSecondsSinceLastHeartbeat,
  isDeviceOffline,
  resolveActiveAlertForDevice,
  resolveAlert
};
