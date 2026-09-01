export function upsertByDeviceId(devices, updatedDevice) {
  const exists = devices.some((device) => device.deviceId === updatedDevice.deviceId);

  if (!exists) {
    return [updatedDevice, ...devices];
  }

  return devices.map((device) =>
    device.deviceId === updatedDevice.deviceId ? { ...device, ...updatedDevice } : device
  );
}

export function getDeviceStats(devices, activeAlertCount = 0) {
  return {
    total: devices.length,
    online: devices.filter((device) => device.status === 'online').length,
    offline: devices.filter((device) => device.status === 'offline').length,
    activeAlerts: activeAlertCount
  };
}

export function filterDevices(devices, searchTerm, status) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return devices.filter((device) => {
    const matchesSearch =
      !normalizedSearch ||
      device.name?.toLowerCase().includes(normalizedSearch) ||
      device.deviceId?.toLowerCase().includes(normalizedSearch);
    const matchesStatus = !status || device.status === status;
    return matchesSearch && matchesStatus;
  });
}

export function bucketAlertsByDay(alerts, days = 7, now = new Date()) {
  const buckets = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - offset);
    buckets.push({
      date: day,
      label: day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count: 0
    });
  }

  const startOfRange = buckets[0].date.getTime();

  alerts.forEach((alert) => {
    if (!alert.triggeredAt) {
      return;
    }

    const triggered = new Date(alert.triggeredAt);
    triggered.setHours(0, 0, 0, 0);
    const triggeredTime = triggered.getTime();

    if (triggeredTime < startOfRange) {
      return;
    }

    const bucket = buckets.find((entry) => entry.date.getTime() === triggeredTime);
    if (bucket) {
      bucket.count += 1;
    }
  });

  return buckets.map(({ label, count }) => ({ label, count }));
}
