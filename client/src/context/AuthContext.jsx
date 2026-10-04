import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, setStoredTokens, clearStoredTokens, getStoredToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('civic_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check auth state on initial mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authAPI.getMe();
        if (response.success && response.data?.user) {
          setUser(response.data.user);
          localStorage.setItem('civic_user', JSON.stringify(response.data.user));
        }
      } catch {
        console.warn('Session expired or invalid, clearing authentication state');
        clearStoredTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for global auth expired events
    const handleExpired = () => {
      setUser(null);
      clearStoredTokens();
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await authAPI.login({ email, password });
      const { user: userData, accessToken, refreshToken } = response.data;

      setStoredTokens(accessToken, refreshToken);
      setUser(userData);
      localStorage.setItem('civic_user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (err) {
      setError(err.message || 'Login failed');
      return { success: false, error: err.message, errors: err.errors };
    }
  };

  const register = async (name, email, password, phone, role = 'citizen') => {
    setError(null);
    try {
      const response = await authAPI.register({ name, email, password, phone, role });
      return {
        success: true,
        requireVerification: response.data?.requireVerification ?? true,
        email: response.data?.email || email,
        message: response.message,
      };
    } catch (err) {
      setError(err.message || 'Registration failed');
      return { success: false, error: err.message, errors: err.errors };
    }
  };

  const verifyEmail = async (email, code) => {
    setError(null);
    try {
      const response = await authAPI.verifyEmail({ email, code });
      if (response.data?.accessToken) {
        const { user: userData, accessToken, refreshToken } = response.data;
        setStoredTokens(accessToken, refreshToken);
        setUser(userData);
        localStorage.setItem('civic_user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
      return { success: true, message: response.message };
    } catch (err) {
      setError(err.message || 'Verification failed');
      return { success: false, error: err.message };
    }
  };

  const updateProfile = async (profileData) => {
    setError(null);
    try {
      const response = await authAPI.updateProfile(profileData);
      if (response.data?.user) {
        setUser(response.data.user);
        localStorage.setItem('civic_user', JSON.stringify(response.data.user));
        return { success: true, user: response.data.user, message: response.message };
      }
      return { success: true, message: response.message };
    } catch (err) {
      setError(err.message || 'Profile update failed');
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore logout API errors
    } finally {
      clearStoredTokens();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        error,
        login,
        register,
        verifyEmail,
        updateProfile,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
