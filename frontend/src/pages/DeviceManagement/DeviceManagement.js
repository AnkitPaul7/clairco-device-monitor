import { useMemo, useState } from 'react';
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { Add, Refresh } from '@mui/icons-material';
import { ConfirmDialog, ErrorBanner } from '../../components/Common';
import DeviceConfig from '../../components/DeviceConfig';
import DeviceList from '../../components/DeviceList';
import { useDeviceContext } from '../../context/device';
import useToast from '../../hooks/useToast';
import { filterDevices } from '../../utils/helpers';
import './DeviceManagement.css';

function DeviceManagement() {
  const { devices, loading, error, fetchDevices, registerDevice, saveDevice, removeDevice } =
    useDeviceContext();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [editingDevice, setEditingDevice] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const toast = useToast();

  const filteredDevices = useMemo(
    () => filterDevices(devices, search, status),
    [devices, search, status]
  );

  const handleCreate = () => {
    setEditingDevice(null);
    setModalOpen(true);
  };

  const handleEdit = (device) => {
    setEditingDevice(device);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (editingDevice) {
      await saveDevice(editingDevice.id || editingDevice.deviceId, {
        name: payload.name,
        expectedInterval: payload.expectedInterval
      });
    } else {
      await registerDevice(payload);
    }
  };

  const handleDeleteRequest = (device) => {
    setPendingDelete(device);
  };

  const handleDeleteConfirm = async () => {
    const device = pendingDelete;
    setPendingDelete(null);

    try {
      await removeDevice(device.id || device.deviceId);
    } catch (deleteError) {
      toast.error(deleteError.message);
    }
  };

  return (
    <div className="app-page device-management-page">
      <div className="page-header">
        <div>
          <Typography variant="h4">Device Management</Typography>
          <Typography variant="body1" color="text.secondary">
            Register, configure, filter, and retire monitored devices.
          </Typography>
        </div>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchDevices}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
            Add device
          </Button>
        </Stack>
      </div>

      <ErrorBanner message={error} onRetry={fetchDevices} />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} className="device-toolbar">
        <TextField
          label="Search devices"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          fullWidth
        />
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="online">Online</MenuItem>
            <MenuItem value="offline">Offline</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <DeviceList
        devices={filteredDevices}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
      />

      <DeviceConfig
        open={modalOpen}
        device={editingDevice}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete device"
        message={pendingDelete ? `Delete ${pendingDelete.name}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}

export default DeviceManagement;
