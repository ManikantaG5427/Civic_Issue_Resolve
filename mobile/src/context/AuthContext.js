import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, {
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  API_STORAGE_KEY,
  DEFAULT_API_HOST,
} from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_HOST);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedUrl = await AsyncStorage.getItem(API_STORAGE_KEY);
        if (storedUrl) {
          setApiUrl(storedUrl);
        }

        const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.warn('Failed to restore auth session from storage', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = response.data.data;

    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, receivedToken);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const register = async (registerData) => {
    const response = await apiClient.post('/auth/register', registerData);
    const { token: receivedToken, user: receivedUser } = response.data.data;

    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, receivedToken);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear credentials from storage', e);
    }
    setToken(null);
    setUser(null);
  };

  const updateApiUrl = async (newUrl) => {
    const cleanUrl = newUrl.trim().replace(/\/$/, '');
    await AsyncStorage.setItem(API_STORAGE_KEY, cleanUrl);
    setApiUrl(cleanUrl);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        apiUrl,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        updateApiUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
