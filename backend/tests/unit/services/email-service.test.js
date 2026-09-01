const {
  EmailService,
  buildEmailContext,
  formatDuration,
  getTimeSince
} = require('../../../src/services/email-service');

describe('email-service', () => {
  it('formats durations for emails', () => {
    expect(formatDuration(5)).toBe('5s');
    expect(formatDuration(65)).toBe('1m 5s');
    expect(formatDuration(3661)).toBe('1h 1m 1s');
  });

  it('builds email context from alert and device data', () => {
    const context = buildEmailContext(
      {
        id: 'alert-1',
        message: 'Offline',
        status: 'active',
        triggeredAt: '2026-09-01T10:00:00.000Z'
      },
      {
        deviceId: 'device-1',
        name: 'Device 1',
        expectedInterval: 60,
        lastHeartbeat: '2026-09-01T09:59:00.000Z'
      },
      { timeSinceLastHeartbeat: '60 seconds' }
    );

    expect(context.deviceId).toBe('device-1');
    expect(context.deviceName).toBe('Device 1');
    expect(context.timeSinceLastHeartbeat).toBe('60 seconds');
  });

  it('calculates time since last heartbeat', () => {
    const now = new Date('2026-09-01T10:00:00.000Z');
    expect(getTimeSince('2026-09-01T09:59:30.000Z', now)).toBe('30s');
  });

  it('skips sending when disabled', async () => {
    const transporter = { sendMail: jest.fn() };
    const service = new EmailService({
      isEnabled: false,
      transporter,
      logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() }
    });

    const result = await service.sendAlertEmail(
      { id: 'alert-1', message: 'Offline', status: 'active' },
      { deviceId: 'device-1', name: 'Device 1', expectedInterval: 60, lastHeartbeat: null }
    );

    expect(result.skipped).toBe(true);
    expect(transporter.sendMail).not.toHaveBeenCalled();
  });
});
