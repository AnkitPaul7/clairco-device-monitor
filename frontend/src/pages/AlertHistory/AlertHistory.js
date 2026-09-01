import { useEffect, useState } from 'react';
import {
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import AlertLog from '../../components/AlertLog';
import { ErrorBanner } from '../../components/Common';
import { useAlertContext } from '../../context/alert';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';
import './AlertHistory.css';

function AlertHistory() {
  const {
    alerts,
    loading,
    error,
    pagination,
    fetchAlerts,
    resolveAlertById,
    acknowledgeAlertById
  } = useAlertContext();
  const [filters, setFilters] = useState({
    deviceId: '',
    status: '',
    from: '',
    to: '',
    page: 1
  });

  useEffect(() => {
    fetchAlerts({
      ...filters,
      limit: DEFAULT_PAGE_SIZE
    });
  }, [fetchAlerts, filters]);

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
      page: field === 'page' ? value : 1
    }));
  };

  return (
    <div className="app-page alert-history-page">
      <div className="page-header">
        <div>
          <Typography variant="h4">Alert History</Typography>
          <Typography variant="body1" color="text.secondary">
            Review active, acknowledged, and resolved device alerts.
          </Typography>
        </div>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => fetchAlerts({ ...filters, limit: DEFAULT_PAGE_SIZE })}
        >
          Refresh
        </Button>
      </div>

      <ErrorBanner
        message={error}
        onRetry={() => fetchAlerts({ ...filters, limit: DEFAULT_PAGE_SIZE })}
      />

      <Grid container spacing={2} className="alert-filters">
        <Grid item xs={12} md={3}>
          <TextField
            label="Device ID"
            value={filters.deviceId}
            onChange={(event) => handleFilterChange('deviceId', event.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={filters.status}
              onChange={(event) => handleFilterChange('status', event.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="acknowledged">Acknowledged</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="From"
            type="date"
            value={filters.from}
            onChange={(event) => handleFilterChange('from', event.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="To"
            type="date"
            value={filters.to}
            onChange={(event) => handleFilterChange('to', event.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>

      <AlertLog
        alerts={alerts}
        loading={loading}
        onResolve={resolveAlertById}
        onAcknowledge={acknowledgeAlertById}
      />

      <Stack alignItems="center">
        <Pagination
          count={pagination.totalPages || 1}
          page={filters.page}
          onChange={(event, page) => handleFilterChange('page', page)}
          color="primary"
        />
      </Stack>
    </div>
  );
}

export default AlertHistory;
