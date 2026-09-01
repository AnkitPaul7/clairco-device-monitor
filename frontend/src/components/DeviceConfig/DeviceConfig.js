import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField
} from '@mui/material';
import './DeviceConfig.css';

const initialForm = {
  deviceId: '',
  name: '',
  expectedInterval: 60
};

function DeviceConfig({ open, device, onClose, onSubmit }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (device) {
      setForm({
        deviceId: device.deviceId || '',
        name: device.name || '',
        expectedInterval: device.expectedInterval || 60
      });
    } else {
      setForm(initialForm);
    }
  }, [device, open]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      await onSubmit({
        ...form,
        expectedInterval: Number(form.expectedInterval)
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>{device ? 'Edit device' : 'Register device'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} className="device-config-fields">
            <TextField
              label="Device ID"
              name="deviceId"
              value={form.deviceId}
              onChange={handleChange}
              disabled={Boolean(device)}
              required
              inputProps={{ pattern: '[A-Za-z0-9_-]+', maxLength: 50 }}
            />
            <TextField
              label="Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              inputProps={{ minLength: 2, maxLength: 100 }}
            />
            <TextField
              label="Expected interval"
              name="expectedInterval"
              type="number"
              value={form.expectedInterval}
              onChange={handleChange}
              required
              inputProps={{ min: 5, max: 86400 }}
              helperText="Seconds between expected telemetry messages"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default DeviceConfig;
