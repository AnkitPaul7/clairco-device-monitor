const { Device } = require('../models');
const alertService = require('./alert-service');
const { calculateDeviceStatus, toPlainObject } = require('../utils/helpers');

class AlertScheduler {
  constructor(options = {}) {
    this.intervalMs = Number(options.intervalMs || process.env.ALERT_CHECK_INTERVAL_MS || 15000);
    this.deviceModel = options.deviceModel || Device;
    this.alertService = options.alertService || alertService;
    this.logger = options.logger || console;
    this.timer = null;
    this.isRunning = false;
    this.isChecking = false;
  }

  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.logger.info(`Alert scheduler started with ${this.intervalMs}ms interval`);
    this.checkDevices().catch((error) =>
      this.logger.error('Initial alert scheduler check failed', error)
    );
    this.timer = setInterval(() => {
      this.checkDevices().catch((error) =>
        this.logger.error('Alert scheduler check failed', error)
      );
    }, this.intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.isRunning = false;
    this.isChecking = false;
    this.logger.info('Alert scheduler stopped');
  }

  async checkDevices(now = new Date()) {
    if (this.isChecking) {
      this.logger.warn('Alert scheduler check skipped because previous check is still running');
      return { checked: 0, created: 0, resolved: 0, skipped: true };
    }

    this.isChecking = true;

    try {
      const devices = await this.deviceModel.find({ isActive: true });

      const summary = {
        checked: devices.length,
        created: 0,
        resolved: 0,
        skipped: false
      };

      for (const device of devices) {
        const plainDevice = toPlainObject(device);
        const deviceId = plainDevice.deviceId || plainDevice.device_id;
        const status = calculateDeviceStatus(plainDevice, now);

        if (status === 'offline') {
          const before = await this.alertService.getActiveAlertForDevice(deviceId);
          await this.alertService.createAlertForDevice(plainDevice, { now });
          const after = before || (await this.alertService.getActiveAlertForDevice(deviceId));

          if (!before && after) {
            summary.created += 1;
          }
        } else if (status === 'online') {
          const resolvedAlert = await this.alertService.resolveActiveAlertForDevice(deviceId, {
            device: plainDevice,
            resolvedAt: now,
            sendRecoveryEmail: process.env.SEND_RECOVERY_EMAILS === 'true'
          });

          if (resolvedAlert) {
            summary.resolved += 1;
          }
        }
      }

      this.logger.info('Alert scheduler check completed', summary);
      return summary;
    } finally {
      this.isChecking = false;
    }
  }
}

let activeScheduler = null;

function startAlertScheduler(options = {}) {
  if (!activeScheduler) {
    activeScheduler = new AlertScheduler(options);
  }

  activeScheduler.start();
  return activeScheduler;
}

function stopAlertScheduler() {
  if (activeScheduler) {
    activeScheduler.stop();
    activeScheduler = null;
  }
}

module.exports = {
  AlertScheduler,
  startAlertScheduler,
  stopAlertScheduler
};
