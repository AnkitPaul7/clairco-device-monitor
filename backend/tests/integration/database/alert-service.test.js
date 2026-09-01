const shouldRun = process.env.RUN_DB_INTEGRATION === 'true';
const describeDb = shouldRun ? describe : describe.skip;

describeDb('alert-service database integration', () => {
  let models;
  let alertService;

  beforeAll(async () => {
    models = require('../../../src/models');
    alertService = require('../../../src/services/alert-service');

    if (models.mongoose.connection.readyState === 0) {
      const connectDB = require('../../../src/config/database');
      await connectDB(process.env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    if (models?.mongoose) {
      await models.mongoose.disconnect();
    }
  });

  it('creates only one active alert per device and resolves it', async () => {
    const deviceId = `integration-device-${Date.now()}`;
    const device = await models.Device.create({
      deviceId,
      name: 'Integration Device',
      expectedInterval: 5,
      lastHeartbeat: new Date(Date.now() - 60000),
      isActive: true,
      metadata: {}
    });

    const firstAlert = await alertService.createAlertForDevice(device);
    const secondAlert = await alertService.createAlertForDevice(device);

    expect(secondAlert.id).toBe(firstAlert.id);

    const activeCount = await models.Alert.countDocuments({
      deviceId,
      status: 'active'
    });

    expect(activeCount).toBe(1);

    const resolvedAlert = await alertService.resolveActiveAlertForDevice(deviceId);
    expect(resolvedAlert.status).toBe('resolved');

    device.isActive = false;
    await device.save();
  });
});
