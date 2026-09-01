const mqtt = require('mqtt');

const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const deviceId = process.env.MQTT_TEST_DEVICE_ID || 'demo-device-1';
const topic = `devices/${deviceId}/telemetry`;
const client = mqtt.connect(brokerUrl, {
  clientId: `clairco-test-publisher-${Date.now()}`
});

const telemetry = {
  temperature: Number(process.env.MQTT_TEST_TEMPERATURE || 24.5),
  humidity: Number(process.env.MQTT_TEST_HUMIDITY || 55),
  pressure: Number(process.env.MQTT_TEST_PRESSURE || 1013),
  timestamp: new Date().toISOString(),
  battery: Number(process.env.MQTT_TEST_BATTERY || 85)
};

client.on('connect', () => {
  client.publish(topic, JSON.stringify(telemetry), { qos: 0 }, (error) => {
    if (error) {
      console.error('Failed to publish MQTT test message:', error);
      client.end(true);
      process.exitCode = 1;
      return;
    }

    console.log(`Published MQTT test message to ${topic}`);
    console.log(JSON.stringify(telemetry, null, 2));
    client.end();
  });
});

client.on('error', (error) => {
  console.error('MQTT test publisher error:', error);
  client.end(true);
  process.exitCode = 1;
});
