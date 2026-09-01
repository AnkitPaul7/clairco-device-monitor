import { useContext } from 'react';
import DeviceContext from './DeviceContext';

export default function useDeviceContext() {
  return useContext(DeviceContext);
}
