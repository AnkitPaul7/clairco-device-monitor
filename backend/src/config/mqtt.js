const mqttConfig = {
  brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
  topic: process.env.MQTT_TOPIC || 'devices/+/telemetry',
  clientId: process.env.MQTT_CLIENT_ID || `clairco-monitor-${process.pid}`,
  autoCreateDevices: process.env.MQTT_AUTO_CREATE_DEVICES === 'true',
  defaultExpectedInterval: Number(process.env.MQTT_DEFAULT_EXPECTED_INTERVAL || 60),
  reconnect: {
    initialDelayMs: Number(process.env.MQTT_RECONNECT_INITIAL_DELAY_MS || 1000),
    maxDelayMs: Number(process.env.MQTT_RECONNECT_MAX_DELAY_MS || 30000),
    factor: Number(process.env.MQTT_RECONNECT_FACTOR || 2)
  }
};

module.exports = mqttConfig;
