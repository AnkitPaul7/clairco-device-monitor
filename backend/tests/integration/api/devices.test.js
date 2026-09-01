jest.mock('../../../src/services/device-service', () => ({
  createDevice: jest.fn(),
  deleteDevice: jest.fn(),
  getAllDevices: jest.fn(),
  getDeviceById: jest.fn(),
  updateDevice: jest.fn()
}));

const express = require('express');
const request = require('supertest');
const deviceRoutes = require('../../../src/routes/devices');
const deviceService = require('../../../src/services/device-service');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/devices', deviceRoutes);
  return app;
}

describe('devices API', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  it('GET /api/devices returns all devices', async () => {
    deviceService.getAllDevices.mockResolvedValue([
      { id: '1', deviceId: 'device-1', name: 'Device 1', status: 'online' }
    ]);

    const response = await request(app).get('/api/devices');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
  });

  it('GET /api/devices/:id returns one device', async () => {
    deviceService.getDeviceById.mockResolvedValue({
      id: '1',
      deviceId: 'device-1',
      name: 'Device 1',
      status: 'online'
    });

    const response = await request(app).get('/api/devices/device-1');

    expect(response.status).toBe(200);
    expect(response.body.data.deviceId).toBe('device-1');
  });

  it('POST /api/devices validates request body', async () => {
    const response = await request(app)
      .post('/api/devices')
      .send({ deviceId: 'bad id', name: 'A', expectedInterval: 1 });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        'Device ID must contain only letters, numbers, hyphens, and underscores',
        'Device name must be at least 2 characters',
        'Expected interval must be between 5 and 86400 seconds'
      ])
    );
  });

  it('POST /api/devices creates a device', async () => {
    deviceService.createDevice.mockResolvedValue({
      id: '1',
      deviceId: 'device-1',
      name: 'Device 1',
      expectedInterval: 60,
      status: 'pending'
    });

    const response = await request(app)
      .post('/api/devices')
      .send({ deviceId: 'device-1', name: 'Device 1', expectedInterval: 60 });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('pending');
  });

  it('POST /api/devices returns 409 for duplicate deviceId', async () => {
    const error = new Error('Device ID already exists');
    error.statusCode = 409;
    deviceService.createDevice.mockRejectedValue(error);

    const response = await request(app)
      .post('/api/devices')
      .send({ deviceId: 'device-1', name: 'Device 1', expectedInterval: 60 });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Device ID already exists');
  });

  it('PUT /api/devices/:id updates a device', async () => {
    deviceService.updateDevice.mockResolvedValue({
      id: '1',
      deviceId: 'device-1',
      name: 'Updated Device',
      expectedInterval: 120,
      status: 'online'
    });

    const response = await request(app)
      .put('/api/devices/device-1')
      .send({ name: 'Updated Device', expectedInterval: 120 });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('Updated Device');
  });

  it('DELETE /api/devices/:id soft deletes a device', async () => {
    deviceService.deleteDevice.mockResolvedValue({
      id: '1',
      deviceId: 'device-1',
      isActive: false,
      status: 'online'
    });

    const response = await request(app).delete('/api/devices/device-1');

    expect(response.status).toBe(200);
    expect(response.body.data.isActive).toBe(false);
  });

  it('returns 404 when service cannot find a device', async () => {
    const error = new Error('Device not found');
    error.statusCode = 404;
    deviceService.getDeviceById.mockRejectedValue(error);

    const response = await request(app).get('/api/devices/missing');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Device not found');
  });
});
