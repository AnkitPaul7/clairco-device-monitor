import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import config from '../../config';
import SocketContext from './SocketContext';

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketClient = io(config.wsUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000
    });

    socketClient.on('connect', () => setConnected(true));
    socketClient.on('disconnect', () => setConnected(false));

    setSocket(socketClient);

    return () => {
      socketClient.disconnect();
      setSocket(null);
    };
  }, []);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
