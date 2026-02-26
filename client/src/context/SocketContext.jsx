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
      // Use the Vite environment variable for the backend URL
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://ems-app-e26y.onrender.com';
      const newSocket = io(backendUrl, {
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
