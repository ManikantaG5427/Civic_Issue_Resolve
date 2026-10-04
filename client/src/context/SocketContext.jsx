import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [liveNotification, setLiveNotification] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('civic_access_token');
    const apiUrl =
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL ||
      'http://localhost:5000/api';
    const socketUrl = apiUrl.replace(/\/api\/?$/, '');

    // Skip attempting connection if in production and pointing to localhost
    const isLocalhost = socketUrl.includes('localhost') || socketUrl.includes('127.0.0.1');
    const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');

    if (isProduction && isLocalhost) {
      // In production without live backend URL configured, avoid spamming localhost socket errors
      return;
    }

    const socket = io(socketUrl, {
      auth: {
        token: token || '',
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 5000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      // Gracefully handle socket connection errors
      setIsConnected(false);
    });

    socket.on('new_notification', (notif) => {
      setLiveNotification(notif);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const joinIssue = (issueId) => {
    if (socketRef.current && issueId) {
      socketRef.current.emit('join_issue', issueId);
    }
  };

  const leaveIssue = (issueId) => {
    if (socketRef.current && issueId) {
      socketRef.current.emit('leave_issue', issueId);
    }
  };

  const subscribeToEvent = (eventName, callback) => {
    if (socketRef.current && eventName && callback) {
      socketRef.current.on(eventName, callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off(eventName, callback);
      }
    };
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        liveNotification,
        joinIssue,
        leaveIssue,
        subscribeToEvent,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
