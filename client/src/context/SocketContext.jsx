import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Use the absolute URL of the Render backend for the WebSocket connection.
    // This is necessary because WebSockets do not work with relative paths in the same way as HTTP requests.
    const socketURL = 'https://ems-app-e26y.onrender.com';
    const newSocket = io(socketURL, {
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
