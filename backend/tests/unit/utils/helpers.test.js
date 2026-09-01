const {
  toPlainObject,
  calculateDeviceStatus,
  formatDeviceResponse,
  createError
} = require('../../../src/utils/helpers');

function makeMongooseLikeDocument(fields) {
  return {
    ...fields,
    _doc: fields,
    get(path) {
      if (typeof path !== 'string') {
        throw new TypeError('path.split is not a function');
      }
      return path.split('.').reduce((value, key) => (value ? value[key] : undefined), fields);
    },
    toJSON() {
      return { ...fields };
    },
    toObject() {
      return { ...fields };
    }
  };
}

describe('toPlainObject', () => {
  it('does not call .get() with an options object (regression: breaks real Mongoose documents)', () => {
    const doc = makeMongooseLikeDocument({ deviceId: 'device-1', name: 'Device 1' });

    expect(() => toPlainObject(doc)).not.toThrow();
    expect(toPlainObject(doc)).toEqual({ deviceId: 'device-1', name: 'Device 1' });
  });

  it('falls back to toObject() when toJSON is unavailable', () => {
    const doc = {
      deviceId: 'device-2',
      toObject: () => ({ deviceId: 'device-2', name: 'Device 2' })
    };

    expect(toPlainObject(doc)).toEqual({ deviceId: 'device-2', name: 'Device 2' });
  });

  it('returns plain objects and falsy values unchanged', () => {
    expect(toPlainObject(null)).toBeNull();
    expect(toPlainObject(undefined)).toBeUndefined();
    expect(toPlainObject({ deviceId: 'device-3' })).toEqual({ deviceId: 'device-3' });
  });
});

describe('calculateDeviceStatus', () => {
  it('returns pending when there is no heartbeat yet', () => {
    const doc = makeMongooseLikeDocument({
      deviceId: 'device-1',
      expectedInterval: 60,
      lastHeartbeat: null
    });
    expect(calculateDeviceStatus(doc)).toBe('pending');
  });

  it('returns online when the heartbeat is within the expected interval', () => {
    const now = new Date('2026-01-01T00:01:00.000Z');
    const doc = makeMongooseLikeDocument({
      expectedInterval: 60,
      lastHeartbeat: new Date('2026-01-01T00:00:30.000Z')
    });
    expect(calculateDeviceStatus(doc, now)).toBe('online');
  });

  it('returns offline once the heartbeat is older than the expected interval', () => {
    const now = new Date('2026-01-01T00:05:00.000Z');
    const doc = makeMongooseLikeDocument({
      expectedInterval: 60,
      lastHeartbeat: new Date('2026-01-01T00:00:00.000Z')
    });
    expect(calculateDeviceStatus(doc, now)).toBe('offline');
  });
});

describe('formatDeviceResponse', () => {
  it('normalizes a real-document-shaped record into a plain response', () => {
    const doc = makeMongooseLikeDocument({
      id: 'abc123',
      deviceId: 'device-1',
      name: 'Device 1',
      expectedInterval: 60,
      lastHeartbeat: new Date('2026-01-01T00:00:00.000Z'),
      isActive: true,
      metadata: { room: 'lobby' }
    });

    const response = formatDeviceResponse(doc, new Date('2026-01-01T00:00:10.000Z'));

    expect(response).toMatchObject({
      id: 'abc123',
      deviceId: 'device-1',
      name: 'Device 1',
      expectedInterval: 60,
      isActive: true,
      metadata: { room: 'lobby' },
      status: 'online'
    });
  });
});

describe('createError', () => {
  it('attaches a statusCode and optional details to the error', () => {
    const error = createError('Not found', 404, ['bad id']);
    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.details).toEqual(['bad id']);
  });
});
