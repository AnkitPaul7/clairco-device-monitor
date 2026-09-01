const mqtt = require('mqtt');
const mqttConfig = require('../config/mqtt');
const deviceService = require('./device-service');
const socketService = require('./socket-service');

class MqttListener {
  constructor(options = {}) {
    this.config = options.config || mqttConfig;
    this.deviceService = options.deviceService || deviceService;
    this.socketService = options.socketService || socketService;
    this.mqttClientFactory = options.mqttClientFactory || mqtt.connect;
    this.logger = options.logger || console;
    this.client = null;
    this.isRunning = false;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
  }

  start() {
    if (this.isRunning) {
      return this.client;
    }

    this.isRunning = true;
    this.connect();
    return this.client;
  }

  connect() {
    this.clearReconnectTimer();

    this.client = this.mqttClientFactory(this.config.brokerUrl, {
      clientId: this.config.clientId,
      clean: true,
      reconnectPeriod: 0
    });

    this.bindClientEvents(this.client);
    return this.client;
  }

  bindClientEvents(client) {
    client.on('connect', () => this.handleConnect());
    client.on('message', (topic, message) => this.handleMessage(topic, message));
    client.on('error', (error) => this.handleError(error));
    client.on('close', () => this.handleClose());
    client.on('offline', () => this.handleOffline());
  }

  handleConnect() {
    this.reconnectAttempts = 0;
    this.logger.info(`MQTT connected to ${this.config.brokerUrl}`);

    this.client.subscribe(this.config.topic, (error) => {
      if (error) {
        this.logger.error('MQTT subscription failed', error);
        return;
      }

      this.logger.info(`MQTT subscribed to ${this.config.topic}`);
    });
  }

  async handleMessage(topic, message) {
    const receivedAt = new Date();
    const deviceId = extractDeviceIdFromTopic(topic);

    if (!deviceId) {
      this.logger.warn(`Ignoring MQTT message for unsupported topic: ${topic}`);
      return null;
    }

    let telemetry;
    try {
      telemetry = parseTelemetryPayload(message);
    } catch (error) {
      this.logger.warn(`Invalid MQTT payload for ${deviceId}: ${error.message}`);
      return null;
    }

    this.logger.info('MQTT telemetry received', {
      topic,
      deviceId,
      telemetry,
      receivedAt: receivedAt.toISOString()
    });

    try {
      const device = await this.deviceService.updateHeartbeat(deviceId, {
        autoCreate: this.config.autoCreateDevices,
        defaultExpectedInterval: this.config.defaultExpectedInterval,
        metadata: { autoCreatedFromMqtt: true },
        timestamp: receivedAt
      });

      this.socketService.broadcastDeviceHeartbeat(device, telemetry);
      return device;
    } catch (error) {
      if (error.statusCode === 404) {
        this.logger.warn(`MQTT heartbeat ignored for unknown device: ${deviceId}`);
        return null;
      }

      this.logger.error(`MQTT heartbeat update failed for ${deviceId}`, error);
      throw error;
    }
  }

  handleError(error) {
    this.logger.error('MQTT client error', error);

    if (this.client && this.isRunning) {
      this.client.end(true);
    }
  }

  handleClose() {
    this.logger.warn('MQTT connection closed');
    this.scheduleReconnect();
  }

  handleOffline() {
    this.logger.warn('MQTT client offline');
    this.scheduleReconnect();
  }

  scheduleReconnect() {
    if (!this.isRunning || this.reconnectTimer) {
      return;
    }

    const delay = this.getReconnectDelay();
    this.reconnectAttempts += 1;
    this.logger.info(`MQTT reconnect scheduled in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  getReconnectDelay() {
    const { initialDelayMs, maxDelayMs, factor } = this.config.reconnect;
    const delay = initialDelayMs * Math.pow(factor, this.reconnectAttempts);
    return Math.min(delay, maxDelayMs);
  }

  stop() {
    this.isRunning = false;
    this.clearReconnectTimer();

    if (this.client) {
      this.client.end(true);
      this.client = null;
    }
  }

  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

function extractDeviceIdFromTopic(topic) {
  const match = /^devices\/([^/]+)\/telemetry$/.exec(topic);
  return match ? match[1] : null;
}

function parseTelemetryPayload(message) {
  const rawPayload = Buffer.isBuffer(message) ? message.toString('utf8') : String(message);
  const telemetry = JSON.parse(rawPayload);

  if (!telemetry || typeof telemetry !== 'object' || Array.isArray(telemetry)) {
    throw new Error('Payload must be a JSON object');
  }

  return telemetry;
}

let activeListener = null;

function startMqttListener(options = {}) {
  if (!activeListener) {
    activeListener = new MqttListener(options);
  }

  activeListener.start();
  return activeListener;
}

function stopMqttListener() {
  if (activeListener) {
    activeListener.stop();
    activeListener = null;
  }
}

module.exports = {
  MqttListener,
  extractDeviceIdFromTopic,
  parseTelemetryPayload,
  startMqttListener,
  stopMqttListener
};
