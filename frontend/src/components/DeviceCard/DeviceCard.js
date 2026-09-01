import { Button, Card, CardActions, CardContent, Stack, Typography } from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import StatusBadge from '../StatusBadge';
import { formatDateTime, formatInterval, formatRelativeTime } from '../../utils/formatters';
import './DeviceCard.css';

function DeviceCard({ device, onEdit, onDelete, showActions = true }) {
  return (
    <Card className="device-card">
      <CardContent>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <div>
            <Typography variant="h6">{device.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {device.deviceId}
            </Typography>
          </div>
          <StatusBadge status={device.status} />
        </Stack>
        <dl className="device-card-meta">
          <div>
            <dt>Interval</dt>
            <dd>{formatInterval(device.expectedInterval)}</dd>
          </div>
          <div>
            <dt>Last heartbeat</dt>
            <dd>{formatRelativeTime(device.lastHeartbeat)}</dd>
          </div>
          <div>
            <dt>Timestamp</dt>
            <dd>{formatDateTime(device.lastHeartbeat)}</dd>
          </div>
        </dl>
      </CardContent>
      {showActions ? (
        <CardActions>
          <Button startIcon={<Edit />} size="small" onClick={() => onEdit(device)}>
            Edit
          </Button>
          <Button
            startIcon={<Delete />}
            size="small"
            color="error"
            onClick={() => onDelete(device)}
          >
            Delete
          </Button>
        </CardActions>
      ) : null}
    </Card>
  );
}

export default DeviceCard;
