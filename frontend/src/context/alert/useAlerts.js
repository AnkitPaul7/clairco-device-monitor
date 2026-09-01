import { useContext } from 'react';
import AlertContext from './AlertContext';

export default function useAlertContext() {
  return useContext(AlertContext);
}
