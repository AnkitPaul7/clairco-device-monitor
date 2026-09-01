import { createContext } from 'react';

const DeviceContext = createContext({
  devices: [],
  loading: false,
  error: null,
  fetchDevices: () => Promise.resolve(),
  registerDevice: () => Promise.resolve(),
  saveDevice: () => Promise.resolve(),
  removeDevice: () => Promise.resolve()
});

export default DeviceContext;
