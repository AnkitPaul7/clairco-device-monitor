import { useCallback, useEffect, useMemo, useState } from 'react';
import { devicesApi } from '../../api';
import config from '../../config';
import { upsertByDeviceId } from '../../utils/helpers';
import useToast from '../../hooks/useToast';
import { useSocketContext } from '../socket';
import DeviceContext from './DeviceContext';

export function DeviceProvider({ children }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { socket } = useSocketContext();
  const toast = useToast();

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await devicesApi.getDevices();
      setDevices(data);
      return data;
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const registerDevice = useCallback(
    async (payload) => {
      const device = await devicesApi.createDevice(payload);
      setDevices((current) => upsertByDeviceId(current, device));
      toast.success('Device registered');
      return device;
    },
    [toast]
  );

  const saveDevice = useCallback(
    async (id, payload) => {
      const device = await devicesApi.updateDevice(id, payload);
      setDevices((current) => upsertByDeviceId(current, device));
      toast.success('Device updated');
      return device;
    },
    [toast]
  );

  const removeDevice = useCallback(
    async (id) => {
      const device = await devicesApi.deleteDevice(id);
      setDevices((current) =>
        current.filter((item) => item.id !== device.id && item.deviceId !== id)
      );
      toast.success('Device deleted');
      return device;
    },
    [toast]
  );

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    const timer = setInterval(() => {
      fetchDevices();
    }, config.refreshIntervalMs);

    return () => clearInterval(timer);
  }, [fetchDevices]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleHeartbeat = (payload) => {
      if (payload.device) {
        setDevices((current) => upsertByDeviceId(current, payload.device));
      }
    };

    const handleStatus = (payload) => {
      if (payload.device) {
        setDevices((current) => upsertByDeviceId(current, payload.device));
      }
    };

    socket.on('device:heartbeat', handleHeartbeat);
    socket.on('device:status', handleStatus);

    return () => {
      socket.off('device:heartbeat', handleHeartbeat);
      socket.off('device:status', handleStatus);
    };
  }, [socket]);

  const value = useMemo(
    () => ({
      devices,
      loading,
      error,
      fetchDevices,
      registerDevice,
      saveDevice,
      removeDevice
    }),
    [devices, loading, error, fetchDevices, registerDevice, saveDevice, removeDevice]
  );

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}
