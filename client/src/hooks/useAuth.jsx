import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { authAPI } from '../services/api';
import { initializeSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    // Clear socket connection first
    disconnectSocket();

    // Clear state
    setUser(null);
    setToken(null);

    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Clear any other auth-related data
    localStorage.removeItem('authTime');

    // Force a small delay to ensure cleanup completes
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 50);
    });
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const data = await authAPI.getProfile();
      setUser(data.data);
    } catch (error) {
      console.error('Failed to load user:', error);
      await logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      loadUser();
      initializeSocket(token);
    } else {
      setLoading(false);
    }
  }, [token, loadUser]);

  const login = async (credentials) => {
    const data = await authAPI.login(credentials);
    setToken(data.data.token);
    setUser(data.data.user);
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    initializeSocket(data.data.token);
    return data;
  };

  const register = async (userData) => {
    const data = await authAPI.register(userData);
    setToken(data.data.token);
    setUser(data.data.user);
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    initializeSocket(data.data.token);
    return data;
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    localStorage.setItem('user', JSON.stringify(updatedUserData));
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    isDonor: user?.role === 'donor',
    isRecipient: user?.role === 'recipient'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default useAuth;
