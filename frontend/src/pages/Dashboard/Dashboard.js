import { useEffect, useMemo } from 'react';
import { Grid, Stack, Typography } from '@mui/material';
import { Devices, ErrorOutline, NotificationsActive, Wifi } from '@mui/icons-material';
import AlertLog from '../../components/AlertLog';
import AlertsTrendChart from '../../components/AlertsTrendChart';
import { ErrorBanner } from '../../components/Common';
import DeviceList from '../../components/DeviceList';
import StatsCard from '../../components/StatsCard';
import { useAlertContext } from '../../context/alert';
import { useDeviceContext } from '../../context/device';
import { getDeviceStats } from '../../utils/helpers';
import './Dashboard.css';

function Dashboard() {
  const {
    devices,
    loading: devicesLoading,
    error: devicesError,
    fetchDevices
  } = useDeviceContext();
  const {
    activeAlerts,
    alerts,
    loading: alertsLoading,
    stats,
    error: alertsError,
    fetchAlerts
  } = useAlertContext();
  const dashboardStats = useMemo(
    () => getDeviceStats(devices, stats.active || activeAlerts.length),
    [activeAlerts.length, devices, stats.active]
  );
  const recentAlerts = alerts.slice(0, 5);

  useEffect(() => {
    fetchAlerts({ limit: 50 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app-page dashboard-page">
      <div className="page-header">
        <div>
          <Typography variant="h4">Dashboard</Typography>
          <Typography variant="body1" color="text.secondary">
            Live device health, heartbeat status, and recent alert activity.
          </Typography>
        </div>
      </div>

      <ErrorBanner message={devicesError} onRetry={fetchDevices} />
      <ErrorBanner message={alertsError} onRetry={() => fetchAlerts({ limit: 50 })} />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatsCard title="Total devices" value={dashboardStats.total} icon={<Devices />} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatsCard title="Online" value={dashboardStats.online} icon={<Wifi />} tone="success" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatsCard
            title="Offline"
            value={dashboardStats.offline}
            icon={<ErrorOutline />}
            tone="danger"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatsCard
            title="Active alerts"
            value={dashboardStats.activeAlerts}
            icon={<NotificationsActive />}
            tone="warning"
          />
        </Grid>
      </Grid>

      <section className="dashboard-section">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Device status</Typography>
        </Stack>
        <DeviceList devices={devices.slice(0, 6)} loading={devicesLoading} showActions={false} />
      </section>

      <section className="dashboard-section">
        <Grid container spacing={2}>
          <Grid item xs={12} lg={7}>
            <AlertsTrendChart alerts={alerts} />
          </Grid>
          <Grid item xs={12} lg={5}>
            <Typography variant="h5" gutterBottom>
              Recent alerts
            </Typography>
            <AlertLog alerts={recentAlerts} loading={alertsLoading} compact />
          </Grid>
        </Grid>
      </section>
    </div>
  );
}

export default Dashboard;
