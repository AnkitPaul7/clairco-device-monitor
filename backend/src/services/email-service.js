const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { emailConfig, validateEmailConfig } = require('../config/email');

const templateDir = path.resolve(__dirname, '../../templates');

class EmailService {
  constructor(options = {}) {
    this.config = options.config || emailConfig;
    this.logger = options.logger || console;
    this.transporter = options.transporter || null;
    this.isEnabled = options.isEnabled ?? validateEmailConfig(this.logger);
  }

  getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.auth
      });
    }

    return this.transporter;
  }

  async sendAlertEmail(alert, device, details = {}) {
    return this.sendDeviceEmail({
      subject: `⚠️ ALERT: Device ${device.deviceId} is offline!`,
      htmlTemplate: 'email-alert.html',
      textTemplate: 'email-alert.txt',
      alert,
      device,
      details
    });
  }

  async sendRecoveryEmail(alert, device, details = {}) {
    if (!this.config.recoveryEmailsEnabled) {
      return { skipped: true, reason: 'Recovery emails disabled' };
    }

    return this.sendDeviceEmail({
      subject: `✅ RECOVERED: Device ${device.deviceId} is online again!`,
      htmlTemplate: 'email-recovery.html',
      textTemplate: 'email-alert.txt',
      alert,
      device,
      details
    });
  }

  async sendDeviceEmail({ subject, htmlTemplate, textTemplate, alert, device, details }) {
    if (!this.isEnabled) {
      this.logger.warn(`Email skipped for ${device.deviceId}: email service disabled`);
      return { skipped: true, reason: 'Email service disabled' };
    }

    const context = buildEmailContext(alert, device, details);
    const html = renderTemplate(loadTemplate(htmlTemplate), context);
    const text = renderTemplate(loadTemplate(textTemplate), context);

    const result = await this.getTransporter().sendMail({
      from: this.config.from,
      to: this.config.recipient,
      subject,
      html,
      text
    });

    this.logger.info(`Email sent for ${device.deviceId}`, {
      messageId: result.messageId,
      subject
    });

    return result;
  }
}

function loadTemplate(filename) {
  return fs.readFileSync(path.join(templateDir, filename), 'utf8');
}

function renderTemplate(template, context) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = context[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

function buildEmailContext(alert, device, details = {}) {
  return {
    alertId: alert.id,
    alertMessage: alert.message,
    alertStatus: alert.status,
    alertTimestamp: formatDate(alert.triggeredAt || alert.triggered_at || alert.createdAt),
    resolvedAt: formatDate(alert.resolvedAt || alert.resolved_at),
    deviceId: device.deviceId,
    deviceName: device.name,
    expectedInterval: device.expectedInterval,
    lastHeartbeat: formatDate(device.lastHeartbeat),
    timeSinceLastHeartbeat: details.timeSinceLastHeartbeat || getTimeSince(device.lastHeartbeat),
    duration: details.duration || getAlertDuration(alert)
  };
}

function formatDate(value) {
  return value ? new Date(value).toISOString() : 'Never';
}

function getTimeSince(value, now = new Date()) {
  if (!value) {
    return 'No heartbeat received';
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor((now.getTime() - new Date(value).getTime()) / 1000)
  );
  return formatDuration(elapsedSeconds);
}

function getAlertDuration(alert, now = new Date()) {
  const startedAt = alert.triggeredAt || alert.triggered_at || alert.createdAt;
  const resolvedAt = alert.resolvedAt || alert.resolved_at || now;

  if (!startedAt) {
    return 'Unknown';
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor((new Date(resolvedAt).getTime() - new Date(startedAt).getTime()) / 1000)
  );
  return formatDuration(elapsedSeconds);
}

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

module.exports = new EmailService();
module.exports.EmailService = EmailService;
module.exports.buildEmailContext = buildEmailContext;
module.exports.formatDuration = formatDuration;
module.exports.getTimeSince = getTimeSince;
