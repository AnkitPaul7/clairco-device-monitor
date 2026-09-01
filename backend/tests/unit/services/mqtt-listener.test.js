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
const {
  MqttListener,
  extractDeviceIdFromTopic,
  parseTelemetryPayload
} = require('../../../src/services/mqtt-listener');

function makeClient() {
  const client = new EventEmitter();
  client.subscribe = jest.fn((topic, callback) => callback(null));
  client.end = jest.fn();
  return client;
}

function makeListener(overrides = {}) {
  return new MqttListener({
    config: {
      brokerUrl: 'mqtt://localhost:1883',
      topic: 'devices/+/telemetry',
      clientId: 'test-client',
      autoCreateDevices: false,
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
    },
    ...overrides
  });
}

describe('mqtt-listener', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('extracts deviceId from telemetry topic', () => {
    expect(extractDeviceIdFromTopic('devices/device-1/telemetry')).toBe('device-1');
    expect(extractDeviceIdFromTopic('devices/device_2/telemetry')).toBe('device_2');
    expect(extractDeviceIdFromTopic('devices/device-1/state')).toBeNull();
  });

  it('parses JSON telemetry payloads', () => {
    expect(parseTelemetryPayload(Buffer.from('{"temperature":24.5}'))).toEqual({
      temperature: 24.5
    });
  });

  it('rejects non-object JSON payloads', () => {
    expect(() => parseTelemetryPayload(Buffer.from('[1,2]'))).toThrow(
      'Payload must be a JSON object'
    );
  });

  it('connects and subscribes to telemetry topic', () => {
    const client = makeClient();
    const factory = jest.fn(() => client);
    const listener = makeListener({ mqttClientFactory: factory });

    listener.start();
    client.emit('connect');

    expect(factory).toHaveBeenCalledWith('mqtt://localhost:1883', {
      clientId: 'test-client',
      clean: true,
      reconnectPeriod: 0
    });
    expect(client.subscribe).toHaveBeenCalledWith('devices/+/telemetry', expect.any(Function));
  });

  it('updates heartbeat and broadcasts WebSocket events for valid telemetry', async () => {
    const updatedDevice = {
      deviceId: 'device-1',
      name: 'Device 1',
      status: 'online'
    };
    const deviceService = {
      updateHeartbeat: jest.fn().mockResolvedValue(updatedDevice)
    };
    const socketService = {
      broadcastDeviceHeartbeat: jest.fn()
    };
    const listener = makeListener({ deviceService, socketService });

    const result = await listener.handleMessage(
      'devices/device-1/telemetry',
      Buffer.from('{"temperature":24.5,"humidity":55}')
    );

    expect(result).toBe(updatedDevice);
    expect(deviceService.updateHeartbeat).toHaveBeenCalledWith(
      'device-1',
      expect.objectContaining({
        autoCreate: false,
        defaultExpectedInterval: 60
      })
    );
    expect(socketService.broadcastDeviceHeartbeat).toHaveBeenCalledWith(updatedDevice, {
      temperature: 24.5,
      humidity: 55
    });
  });

  it('ignores invalid topics and payloads', async () => {
    const deviceService = {
      updateHeartbeat: jest.fn()
    };
    const listener = makeListener({ deviceService });

    await expect(
      listener.handleMessage('devices/device-1/state', Buffer.from('{}'))
    ).resolves.toBeNull();
    await expect(
      listener.handleMessage('devices/device-1/telemetry', Buffer.from('bad-json'))
    ).resolves.toBeNull();
    expect(deviceService.updateHeartbeat).not.toHaveBeenCalled();
  });

  it('schedules exponential reconnects when closed', () => {
    jest.useFakeTimers();
    const client = makeClient();
    const factory = jest.fn(() => client);
    const listener = makeListener({ mqttClientFactory: factory });

    listener.start();
    client.emit('close');

    expect(listener.reconnectAttempts).toBe(1);
    jest.advanceTimersByTime(10);
    expect(factory).toHaveBeenCalledTimes(2);

    listener.stop();
  });
});
