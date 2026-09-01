import { useCallback, useEffect, useMemo, useState } from 'react';
import { alertsApi } from '../../api';
import config from '../../config';
import useToast from '../../hooks/useToast';
import { useSocketContext } from '../socket';
import AlertContext from './AlertContext';

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0, acknowledged: 0 });
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { socket } = useSocketContext();
  const toast = useToast();

  const fetchAlerts = useCallback(
    async (params = {}) => {
      setLoading(true);
      setError(null);

      try {
        const result = await alertsApi.getAlerts(params);
        setAlerts(result.data);
        setPagination(result.pagination);
        return result;
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
        return { data: [], pagination: {} };
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const fetchActiveAlerts = useCallback(async () => {
    const result = await alertsApi.getActiveAlerts();
    setActiveAlerts(result.data);
    return result.data;
  }, []);

  const fetchAlertStats = useCallback(async () => {
    const data = await alertsApi.getAlertStats();
    setStats(data);
    return data;
  }, []);

  const resolveAlertById = useCallback(
    async (id) => {
      const alert = await alertsApi.resolveAlert(id);
      setAlerts((current) => current.map((item) => (item.id === id ? alert : item)));
      setActiveAlerts((current) => current.filter((item) => item.id !== id));
      await fetchAlertStats();
      toast.success('Alert resolved');
      return alert;
    },
    [fetchAlertStats, toast]
  );

  const acknowledgeAlertById = useCallback(
    async (id) => {
      const alert = await alertsApi.acknowledgeAlert(id);
      setAlerts((current) => current.map((item) => (item.id === id ? alert : item)));
      setActiveAlerts((current) => current.filter((item) => item.id !== id));
      await fetchAlertStats();
      toast.success('Alert acknowledged');
      return alert;
    },
    [fetchAlertStats, toast]
  );

  useEffect(() => {
    fetchAlerts({ limit: 10 });
    fetchActiveAlerts().catch(() => {});
    fetchAlertStats().catch(() => {});
  }, [fetchAlerts, fetchActiveAlerts, fetchAlertStats]);

  useEffect(() => {
    const timer = setInterval(() => {
      fetchActiveAlerts().catch(() => {});
      fetchAlertStats().catch(() => {});
    }, config.refreshIntervalMs);

    return () => clearInterval(timer);
  }, [fetchActiveAlerts, fetchAlertStats]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const refreshActiveAlerts = () => {
      fetchActiveAlerts().catch(() => {});
      fetchAlertStats().catch(() => {});
    };

    const handleAlertCreated = (payload) => {
      toast.warning(`Device ${payload.alert?.deviceId} is offline — alert raised`);
      refreshActiveAlerts();
    };

    const handleAlertResolved = (payload) => {
      toast.success(`Device ${payload.alert?.deviceId} is back online — alert resolved`);
      refreshActiveAlerts();
    };

    const handleAlertAcknowledged = () => {
      refreshActiveAlerts();
    };

    socket.on('alert:created', handleAlertCreated);
    socket.on('alert:resolved', handleAlertResolved);
    socket.on('alert:acknowledged', handleAlertAcknowledged);

    return () => {
      socket.off('alert:created', handleAlertCreated);
      socket.off('alert:resolved', handleAlertResolved);
      socket.off('alert:acknowledged', handleAlertAcknowledged);
    };
  }, [fetchActiveAlerts, fetchAlertStats, socket, toast]);

  const value = useMemo(
    () => ({
      alerts,
      activeAlerts,
      stats,
      pagination,
      loading,
      error,
      fetchAlerts,
      fetchActiveAlerts,
      fetchAlertStats,
      resolveAlertById,
      acknowledgeAlertById
    }),
    [
      alerts,
      activeAlerts,
      stats,
      pagination,
      loading,
      error,
      fetchAlerts,
      fetchActiveAlerts,
      fetchAlertStats,
      resolveAlertById,
      acknowledgeAlertById
    ]
  );

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
}
