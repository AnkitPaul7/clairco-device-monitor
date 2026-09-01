import { Grid } from '@mui/material';
import DeviceCard from '../DeviceCard';
import { EmptyState, Loading } from '../Common';
import './DeviceList.css';

function DeviceList({ devices, loading, onEdit, onDelete, showActions = true }) {
  if (loading) {
    return <Loading label="Loading devices" />;
  }

  if (!devices.length) {
    return <EmptyState title="No devices found" message="Register a device to begin monitoring." />;
  }

  return (
    <Grid container spacing={2} className="device-list">
      {devices.map((device) => (
        <Grid item xs={12} md={6} lg={4} key={device.id || device.deviceId}>
          <DeviceCard
            device={device}
            onEdit={onEdit}
            onDelete={onDelete}
            showActions={showActions}
          />
        </Grid>
      ))}
    </Grid>
  );
}

export default DeviceList;
