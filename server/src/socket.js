import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User.js';

let io = null;

/**
 * Initialize Socket.IO with HTTP server
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    },
    pingTimeout: 60000,
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
        socket.handshake.query?.token;

      if (!token) {
        // Allow unauthenticated connection for public broadcasts, but without private rooms
        socket.user = null;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret_access_key');
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) {
        socket.user = user;
      } else {
        socket.user = null;
      }
      next();
    } catch (err) {
      socket.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    // If authenticated user, automatically join their personal room and role room
    if (socket.user) {
      const userId = socket.user._id.toString();
      socket.join(`user:${userId}`);

      if (['administrator', 'super_admin'].includes(socket.user.role)) {
        socket.join('role:admin');
      }
      if (socket.user.role === 'field_worker') {
        socket.join('role:worker');
      }
    }

    // Join specific issue room for live ticket inspection
    socket.on('join_issue', (issueId) => {
      if (issueId) {
        socket.join(`issue:${issueId}`);
      }
    });

    // Leave issue room
    socket.on('leave_issue', (issueId) => {
      if (issueId) {
        socket.leave(`issue:${issueId}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean up connection
    });
  });

  return io;
};

/**
 * Get the active Socket.IO server instance
 */
export const getIO = () => {
  return io;
};

/**
 * Emit live issue status change and timeline updates
 */
export const emitIssueEvent = (eventName, issue) => {
  if (!io || !issue) return;

  const issueId = issue._id ? issue._id.toString() : issue.toString();
  const issueNumber = issue.issueNumber || '';
  const reporterId = issue.reporter?._id ? issue.reporter._id.toString() : issue.reporter?.toString();
  const workerId = issue.assignedWorker?._id ? issue.assignedWorker._id.toString() : issue.assignedWorker?.toString();

  // 1. Broadcast to everyone viewing this issue room
  io.to(`issue:${issueId}`).emit(eventName, issue);
  if (issueNumber) {
    io.to(`issue:${issueNumber}`).emit(eventName, issue);
  }

  // 2. Broadcast to reporting citizen
  if (reporterId) {
    io.to(`user:${reporterId}`).emit(eventName, issue);
  }

  // 3. Broadcast to assigned worker
  if (workerId) {
    io.to(`user:${workerId}`).emit(eventName, issue);
  }

  // 4. Broadcast to administrators review queue
  io.to('role:admin').emit(eventName, issue);
};

/**
 * Emit in-app notification in real-time
 */
export const emitLiveNotification = (recipientId, notification) => {
  if (!io || !recipientId) return;
  io.to(`user:${recipientId.toString()}`).emit('new_notification', notification);
};
