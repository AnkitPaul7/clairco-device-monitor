import { createContext } from 'react';

const AlertContext = createContext({
  alerts: [],
  activeAlerts: [],
  stats: { total: 0, active: 0, resolved: 0, acknowledged: 0 },
  pagination: {},
  loading: false,
  error: null,
  fetchAlerts: () => Promise.resolve(),
  fetchActiveAlerts: () => Promise.resolve(),
  fetchAlertStats: () => Promise.resolve(),
  resolveAlertById: () => Promise.resolve(),
  acknowledgeAlertById: () => Promise.resolve()
});

export default AlertContext;
