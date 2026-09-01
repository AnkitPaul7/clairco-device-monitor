import { Alert, Button } from '@mui/material';

function ErrorBanner({ message, onRetry }) {
  if (!message) {
    return null;
  }

  return (
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        ) : null
      }
    >
      {message}
    </Alert>
  );
}

export default ErrorBanner;
