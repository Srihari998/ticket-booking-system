import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    const socketUrl = import.meta.env.VITE_SOCKET_URL || (isLocal ? 'http://localhost:5000' : window.location.origin);

    try {
      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 3,
        timeout: 5000
      });

      newSocket.on('connect_error', () => {});

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } catch {
      setSocket(null);
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
