import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
        try {
          const storedToken = localStorage.getItem('token');
          const storedUser = localStorage.getItem('user');
          if (storedToken && storedUser) {
            setToken(storedToken);
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);

            // --- Sync user data from server (to get latest On Duty status) ---
            const response = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
                headers: { Authorization: `Bearer ${storedToken}` }
            });
            const latestUser = response.data;
            setUser(latestUser);
            localStorage.setItem('user', JSON.stringify(latestUser));
          }
        } catch (error) {
          console.error("Auth initialization error", error);
        } finally {
          setIsAuthLoading(false);
        }
    };
    checkAuth();
  }, []);

  const login = (userData, authToken) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    setUser(userData);
    setToken(authToken);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  // --- NEW: Toggle On Duty Status ---
  const toggleOnDuty = async (status) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/auth/toggle-on-duty`,
        { isOnDuty: status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = { ...user, isOnDuty: response.data.isOnDuty };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      console.error("Error toggling on duty status:", error);
      throw error;
    }
  };

  const value = { user, token, login, logout, toggleOnDuty, isAuthenticated: !!token, isAuthLoading };

  if (isAuthLoading) {
    return <div>Loading Application...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
