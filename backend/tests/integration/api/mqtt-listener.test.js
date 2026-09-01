jest.mock('../../../src/services/device-service', () => ({
  updateHeartbeat: jest.fn()
}));

jest.mock('../../../src/services/socket-service', () => ({
  broadcastDeviceHeartbeat: jest.fn()
}));

jest.mock('mqtt', () => ({
  connect: jest.fn()
}));

const { EventEmitter } = require('events');
const mqtt = require('mqtt');
const deviceService = require('../../../src/services/device-service');
const socketService = require('../../../src/services/socket-service');
const { MqttListener } = require('../../../src/services/mqtt-listener');

function makeClient() {
  const client = new EventEmitter();
  client.subscribe = jest.fn((topic, callback) => callback(null));
  client.end = jest.fn();
  return client;
}

describe('mqtt listener integration with mock broker', () => {
  let client;
  let listener;

  beforeEach(() => {
    client = makeClient();
    mqtt.connect.mockReturnValue(client);
    deviceService.updateHeartbeat.mockResolvedValue({
      deviceId: 'device-1',
      name: 'Device 1',
      status: 'online'
    });
    socketService.broadcastDeviceHeartbeat.mockReturnValue(true);

    listener = new MqttListener({
      config: {
        brokerUrl: 'mqtt://mock-broker:1883',
        topic: 'devices/+/telemetry',
        clientId: 'integration-test-client',
        autoCreateDevices: true,
        defaultExpectedInterval: 60,
        reconnect: {
          initialDelayMs: 10,
          maxDelayMs: 100,
          factor: 2
        }
      },
      logger: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn()
      }
    });
  });

  afterEach(() => {
    listener.stop();
    jest.clearAllMocks();
  });

  it('subscribes, receives telemetry, updates heartbeat, and broadcasts status', async () => {
    listener.start();
    client.emit('connect');

    expect(client.subscribe).toHaveBeenCalledWith('devices/+/telemetry', expect.any(Function));

    client.emit(
      'message',
      'devices/device-1/telemetry',
      Buffer.from(JSON.stringify({
        temperature: 24.5,
        humidity: 55,
        pressure: 1013,
        timestamp: '2026-09-01T10:00:00Z',
        battery: 85
      }))
    );

    await new Promise((resolve) => setImmediate(resolve));

    expect(deviceService.updateHeartbeat).toHaveBeenCalledWith('device-1', expect.objectContaining({
      autoCreate: true,
      defaultExpectedInterval: 60
    }));
    expect(socketService.broadcastDeviceHeartbeat).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: 'device-1',
        status: 'online'
      }),
      expect.objectContaining({
        temperature: 24.5,
        battery: 85
      })
    );
  });
});
