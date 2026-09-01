import { createContext } from 'react';

const SocketContext = createContext({
  socket: null,
  connected: false
});

export default SocketContext;
