import { Chip } from '@mui/material';
import { Circle } from '@mui/icons-material';
import { getStatusColor } from '../../utils/colors';
import './StatusBadge.css';

function StatusBadge({ status }) {
  const colors = getStatusColor(status);

  return (
    <Chip
      size="small"
      icon={<Circle className="status-badge-icon" />}
      label={status || 'unknown'}
      className="status-badge"
      sx={{
        color: colors.color,
        backgroundColor: colors.background,
        borderColor: colors.border,
        '& .MuiChip-icon': { color: colors.color }
      }}
    />
  );
}

export default StatusBadge;
