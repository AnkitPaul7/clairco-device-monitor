import { Box, CircularProgress, Typography } from '@mui/material';

function Loading({ label = 'Loading' }) {
  return (
    <Box className="loading-state">
      <CircularProgress size={28} />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

export default Loading;
