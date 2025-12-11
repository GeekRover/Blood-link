import { useEffect, useState } from 'react';
import { getSocket } from '../services/socket';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketInstance = getSocket();
    setSocket(socketInstance);
  }, []);

  return socket;
};

export default useSocket;
