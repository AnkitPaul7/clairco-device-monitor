import { useContext } from 'react';
import SocketContext from './SocketContext';

export default function useSocketContext() {
  return useContext(SocketContext);
}
