const { AlertScheduler } = require('../../../src/services/alert-scheduler');

function makeDevice(overrides = {}) {
  return {
    id: '1',
    deviceId: 'device-1',
    name: 'Device 1',
    expectedInterval: 60,
    lastHeartbeat: new Date(Date.now() - 120000),
    isActive: true,
    toJSON() {
      return {
        id: this.id,
        deviceId: this.deviceId,
        name: this.name,
        expectedInterval: this.expectedInterval,
        lastHeartbeat: this.lastHeartbeat,
        isActive: this.isActive
      };
    },
    ...overrides
  };
}

describe('alert-scheduler', () => {
  it('creates an alert when a device is offline and has no active alert', async () => {
    const device = makeDevice();
    const alertService = {
      createAlertForDevice: jest.fn().mockResolvedValue({ id: 'alert-1' }),
      getActiveAlertForDevice: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'alert-1' }),
      resolveActiveAlertForDevice: jest.fn()
    };
    const scheduler = new AlertScheduler({
      deviceModel: { find: jest.fn().mockResolvedValue([device]) },
      alertService,
      logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() }
    });

    const summary = await scheduler.checkDevices(new Date());

    expect(alertService.createAlertForDevice).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: 'device-1'
      }),
      expect.any(Object)
    );
    expect(summary.created).toBe(1);
  });

  it('does not create duplicate alerts for the same device', async () => {
    const device = makeDevice();
    const alertService = {
      createAlertForDevice: jest.fn().mockResolvedValue({ id: 'alert-1' }),
      getActiveAlertForDevice: jest.fn().mockResolvedValue({ id: 'alert-1' }),
      resolveActiveAlertForDevice: jest.fn()
    };
    const scheduler = new AlertScheduler({
      deviceModel: { find: jest.fn().mockResolvedValue([device]) },
      alertService,
      logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() }
    });

    const summary = await scheduler.checkDevices(new Date());

    expect(alertService.createAlertForDevice).toHaveBeenCalledTimes(1);
    expect(summary.created).toBe(0);
  });

  it('resolves active alerts when a device is online', async () => {
    const device = makeDevice({ lastHeartbeat: new Date() });
    const alertService = {
      createAlertForDevice: jest.fn(),
      getActiveAlertForDevice: jest.fn(),
      resolveActiveAlertForDevice: jest.fn().mockResolvedValue({ id: 'alert-1' })
    };
    const scheduler = new AlertScheduler({
      deviceModel: { find: jest.fn().mockResolvedValue([device]) },
      alertService,
      logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() }
    });

    const summary = await scheduler.checkDevices(new Date());

    expect(alertService.resolveActiveAlertForDevice).toHaveBeenCalledWith(
      'device-1',
      expect.objectContaining({
        device: expect.objectContaining({ deviceId: 'device-1' })
      })
    );
    expect(summary.resolved).toBe(1);
  });
});
