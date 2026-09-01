import { toast } from 'react-toastify';
import { useMemo } from 'react';

export default function useToast() {
  return useMemo(
    () => ({
      success: (message) => toast.success(message),
      error: (message) => toast.error(message),
      info: (message) => toast.info(message),
      warning: (message) => toast.warning(message)
    }),
    []
  );
}
