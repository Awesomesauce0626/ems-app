import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // The connection is established only once and reused.
    const newSocket = io('http://localhost:5000', {
        transports: ['websocket', 'polling'] // fallback to polling if websocket fails
    });
    setSocket(newSocket);

    // Disconnect socket on cleanup
    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
