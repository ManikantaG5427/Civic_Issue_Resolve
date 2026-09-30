import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SOCKET_HOST } from '../config/api';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token, apiUrl } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Determine socket host based on current apiUrl
    let host = SOCKET_HOST;
    try {
      if (apiUrl && apiUrl.startsWith('http')) {
        const urlObj = new URL(apiUrl);
        host = `${urlObj.protocol}//${urlObj.hostname}:${urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80')}`;
      }
    } catch (e) {
      host = SOCKET_HOST;
    }

    const socket = io(host, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('⚡ Mobile Socket connected to', host);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('⚡ Mobile Socket disconnected');
    });

    socket.on('notification:new', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user, apiUrl]);

  const joinIssueRoom = (issueId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join:issue', issueId);
    }
  };

  const leaveIssueRoom = (issueId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave:issue', issueId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        notifications,
        unreadCount,
        setUnreadCount,
        joinIssueRoom,
        leaveIssueRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  return (
    context || {
      socket: null,
      isConnected: false,
      notifications: [],
      unreadCount: 0,
      setUnreadCount: () => {},
      joinIssueRoom: () => {},
      leaveIssueRoom: () => {},
    }
  );
};
