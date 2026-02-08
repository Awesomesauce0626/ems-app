import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import API_BASE_URL from '../api'; // --- DEPLOYMENT FIX: Import the central API URL

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // --- DEPLOYMENT FIX: Use the central API URL for the socket connection ---
    const newSocket = io(API_BASE_URL, {
        transports: ['websocket', 'polling']
    });
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
