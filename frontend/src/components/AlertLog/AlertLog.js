import {
  Button,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography
} from '@mui/material';
import StatusBadge from '../StatusBadge';
import { EmptyState, Loading } from '../Common';
import { formatDateTime } from '../../utils/formatters';
import './AlertLog.css';

function AlertLog({ alerts, loading, compact = false, onResolve, onAcknowledge }) {
  if (loading) {
    return <Loading label="Loading alerts" />;
  }

  if (!alerts.length) {
    return <EmptyState title="No alerts" message="Alert activity will appear here." />;
  }

  return (
    <Card className="alert-log">
      <CardContent>
        <List disablePadding>
          {alerts.map((alert, index) => (
            <div key={alert.id || `${alert.deviceId}-${alert.triggeredAt}`}>
              <ListItem
                disableGutters
                alignItems="flex-start"
                secondaryAction={
                  !compact && alert.status === 'active' ? (
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={() => onAcknowledge?.(alert.id)}>
                        Ack
                      </Button>
                      <Button size="small" variant="outlined" onClick={() => onResolve?.(alert.id)}>
                        Resolve
                      </Button>
                    </Stack>
                  ) : null
                }
              >
                <ListItemText
                  primary={
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      className="alert-log-title"
                    >
                      <Typography variant="subtitle2">{alert.deviceId}</Typography>
                      <StatusBadge status={alert.status} />
                    </Stack>
                  }
                  secondary={
                    <>
                      <span>{alert.message}</span>
                      <span className="alert-log-time">{formatDateTime(alert.triggeredAt)}</span>
                    </>
                  }
                />
              </ListItem>
              {index < alerts.length - 1 ? <Divider /> : null}
            </div>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

export default AlertLog;
