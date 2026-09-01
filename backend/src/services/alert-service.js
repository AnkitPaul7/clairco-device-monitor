const { Op } = require('sequelize');
const { Alert, Device } = require('../models');
const emailService = require('./email-service');
const { calculateDeviceStatus, createError, toPlainObject } = require('../utils/helpers');

const ACTIVE_STATUS = 'active';
const RESOLVED_STATUS = 'resolved';
const ACKNOWLEDGED_STATUS = 'acknowledged';

function normalizeAlert(alert) {
  return toPlainObject(alert);
}

function getDeviceId(device) {
  return device.deviceId || device.device_id;
}

function getExpectedInterval(device) {
  return Number(device.expectedInterval || device.expected_interval);
}

function getLastHeartbeat(device) {
  return device.lastHeartbeat || device.last_heartbeat;
}

function getSecondsSinceLastHeartbeat(device, now = new Date()) {
  const lastHeartbeat = getLastHeartbeat(device);

  if (!lastHeartbeat) {
    return null;
  }

  return Math.max(0, Math.floor((now.getTime() - new Date(lastHeartbeat).getTime()) / 1000));
}

function buildAlertMessage(device, now = new Date()) {
  const secondsElapsed = getSecondsSinceLastHeartbeat(device, now);
  const elapsedText = secondsElapsed === null ? 'no heartbeat has been received' : `${secondsElapsed} seconds elapsed`;

  return `Device ${device.name} (${getDeviceId(device)}) missed expected heartbeat interval of ${getExpectedInterval(device)} seconds; ${elapsedText}.`;
}

async function getActiveAlertForDevice(deviceId) {
  return Alert.findOne({
    where: {
      deviceId,
      status: ACTIVE_STATUS
    }
  });
}

async function createAlertForDevice(device, options = {}) {
  const plainDevice = toPlainObject(device);
  const deviceId = getDeviceId(plainDevice);
  const existingAlert = await getActiveAlertForDevice(deviceId);

  if (existingAlert) {
    return normalizeAlert(existingAlert);
  }

  const now = options.now || new Date();
  const message = options.message || buildAlertMessage(plainDevice, now);
  const alert = await Alert.create({
    deviceId,
    message,
    status: ACTIVE_STATUS,
    emailSent: false
  });

  const plainAlert = normalizeAlert(alert);

  try {
    await emailService.sendAlertEmail(plainAlert, plainDevice, {
      timeSinceLastHeartbeat: `${getSecondsSinceLastHeartbeat(plainDevice, now)} seconds`
    });
    await alert.update({ emailSent: true });
    plainAlert.emailSent = true;
  } catch (error) {
    await alert.update({ emailSent: false });
    plainAlert.emailSent = false;
    console.error(`Failed to send alert email for ${deviceId}`, error);
  }

  return plainAlert;
}

async function resolveActiveAlertForDevice(deviceId, options = {}) {
  const activeAlert = await getActiveAlertForDevice(deviceId);

  if (!activeAlert) {
    return null;
  }

  const resolvedAt = options.resolvedAt || new Date();
  await activeAlert.update({
    status: RESOLVED_STATUS,
    resolvedAt
  });

  const resolvedAlert = normalizeAlert(activeAlert);

  if (options.sendRecoveryEmail) {
    try {
      const device = options.device || await Device.findOne({ where: { deviceId } });
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
  const alert = await Alert.findByPk(id);

  if (!alert) {
    throw createError('Alert not found', 404);
  }

  await alert.update({ status: ACKNOWLEDGED_STATUS });
  return normalizeAlert(alert);
}

async function resolveAlert(id) {
  const alert = await Alert.findByPk(id);

  if (!alert) {
    throw createError('Alert not found', 404);
  }

  await alert.update({
    status: RESOLVED_STATUS,
    resolvedAt: new Date()
  });

  return normalizeAlert(alert);
}

async function getAlertById(id) {
  const alert = await Alert.findByPk(id);

  if (!alert) {
    throw createError('Alert not found', 404);
  }

  return normalizeAlert(alert);
}

function buildAlertFilters(query = {}) {
  const where = {};

  if (query.deviceId) {
    where.deviceId = query.deviceId;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.from || query.to) {
    where.triggeredAt = {};

    if (query.from) {
      where.triggeredAt[Op.gte] = new Date(query.from);
    }

    if (query.to) {
      where.triggeredAt[Op.lte] = new Date(query.to);
    }
  }

  return where;
}

async function getAlerts(query = {}) {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
  const offset = (page - 1) * limit;
  const where = buildAlertFilters(query);

  const result = await Alert.findAndCountAll({
    where,
    limit,
    offset,
    order: [['triggeredAt', 'DESC']]
  });

  return {
    data: result.rows.map(normalizeAlert),
    pagination: {
      page,
      limit,
      total: result.count,
      totalPages: Math.ceil(result.count / limit)
    }
  };
}

async function getActiveAlertsCount() {
  return Alert.count({
    where: {
      status: ACTIVE_STATUS
    }
  });
}

async function getAlertStatistics() {
  const [total, active, resolved, acknowledged] = await Promise.all([
    Alert.count(),
    Alert.count({ where: { status: ACTIVE_STATUS } }),
    Alert.count({ where: { status: RESOLVED_STATUS } }),
    Alert.count({ where: { status: ACKNOWLEDGED_STATUS } })
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
