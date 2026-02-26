import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext'; // Assuming you have an AuthContext

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { token } = useAuth(); // Get the auth token to pass with connection

  useEffect(() => {
    if (token) {
      // Use the environment variable for the backend URL
      const newSocket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
        auth: {
          token: token
        }
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket.IO connected successfully:', newSocket.id);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket.IO connection error:', err.message);
      });

      // Cleanup on component unmount
      return () => {
        newSocket.off('connect');
        newSocket.off('connect_error');
        newSocket.disconnect();
      };
    } else {
        // If there's no token, disconnect any existing socket
        if(socket) {
            socket.disconnect();
            setSocket(null);
        }
    }
  }, [token]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
