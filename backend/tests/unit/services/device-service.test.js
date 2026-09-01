jest.mock('../../../src/models', () => ({
  Device: {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn()
  }
}));

const { Device } = require('../../../src/models');
const deviceService = require('../../../src/services/device-service');

function makeDevice(overrides = {}) {
  const device = {
    id: '11111111-1111-1111-1111-111111111111',
    deviceId: 'device-1',
    name: 'Device 1',
    expectedInterval: 60,
    lastHeartbeat: new Date(),
    isActive: true,
    metadata: {},
    update: jest.fn(async function update(payload) {
      Object.assign(this, payload);
      return this;
    }),
    get() {
      return {
        id: this.id,
        deviceId: this.deviceId,
        name: this.name,
        expectedInterval: this.expectedInterval,
        lastHeartbeat: this.lastHeartbeat,
        isActive: this.isActive,
        metadata: this.metadata
      };
    },
    ...overrides
  };

  return device;
}

describe('device-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllDevices', () => {
    it('returns active devices with computed status', async () => {
      Device.findAll.mockResolvedValue([
        makeDevice({ lastHeartbeat: new Date() }),
        makeDevice({ deviceId: 'device-2', lastHeartbeat: null })
      ]);

      const devices = await deviceService.getAllDevices();

      expect(Device.findAll).toHaveBeenCalledWith({
        where: { isActive: true },
        order: [['createdAt', 'DESC']]
      });
      expect(devices).toHaveLength(2);
      expect(devices[0].status).toBe('online');
      expect(devices[1].status).toBe('pending');
    });
  });

  describe('getDeviceById', () => {
    it('returns one device by id or deviceId', async () => {
      Device.findOne.mockResolvedValue(makeDevice());

      const device = await deviceService.getDeviceById('device-1');

      expect(device.deviceId).toBe('device-1');
      expect(device.status).toBe('online');
    });

    it('throws 404 when device is missing', async () => {
      Device.findOne.mockResolvedValue(null);

      await expect(deviceService.getDeviceById('missing')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Device not found'
      });
    });
  });

  describe('createDevice', () => {
    it('creates a new device', async () => {
      Device.findOne.mockResolvedValue(null);
      Device.create.mockResolvedValue(makeDevice({ lastHeartbeat: null }));

      const device = await deviceService.createDevice({
        deviceId: 'device-1',
        name: 'Device 1',
        expectedInterval: '60'
      });

      expect(Device.create).toHaveBeenCalledWith({
        deviceId: 'device-1',
        name: 'Device 1',
        expectedInterval: 60,
        metadata: {}
      });
      expect(device.status).toBe('pending');
    });

    it('throws 409 for duplicate deviceId', async () => {
      Device.findOne.mockResolvedValue(makeDevice());

      await expect(deviceService.createDevice({
        deviceId: 'device-1',
        name: 'Device 1',
        expectedInterval: 60
      })).rejects.toMatchObject({
        statusCode: 409,
        message: 'Device ID already exists'
      });
    });
  });

  describe('updateDevice', () => {
    it('updates device configuration', async () => {
      const existingDevice = makeDevice();
      Device.findOne.mockResolvedValueOnce(existingDevice);

      const device = await deviceService.updateDevice('device-1', {
        name: 'Updated Device',
        expectedInterval: 120
      });

      expect(existingDevice.update).toHaveBeenCalledWith({
        name: 'Updated Device',
        expectedInterval: 120
      });
      expect(device.name).toBe('Updated Device');
      expect(device.expectedInterval).toBe(120);
    });
  });

  describe('deleteDevice', () => {
    it('soft deletes a device', async () => {
      const existingDevice = makeDevice();
      Device.findOne.mockResolvedValue(existingDevice);

      const device = await deviceService.deleteDevice('device-1');

      expect(existingDevice.update).toHaveBeenCalledWith({ isActive: false });
      expect(device.isActive).toBe(false);
    });
  });
});
