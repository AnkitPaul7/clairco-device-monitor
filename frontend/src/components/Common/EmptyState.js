import { Box, Typography } from '@mui/material';

function EmptyState({
  title = 'No data yet',
  message = 'Records will appear here when available.'
}) {
  return (
    <Box className="empty-state">
      <Typography variant="h6">{title}</Typography>
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

export default EmptyState;
