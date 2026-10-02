import 'dotenv/config';
import dns from 'dns';

// Fix Windows DNS querySrv ECONNREFUSED with MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {}

import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './socket.js';
import { initSlaCron, stopSlaCron } from './services/slaCronService.js';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Start HTTP Server
const server = app.listen(PORT, () => {
  console.info(`=================================================`);
  console.info(`  CivicResolve Backend API`);
  console.info(`  Environment : ${process.env.NODE_ENV || 'development'}`);
  console.info(`  Port        : ${PORT}`);
  console.info(`  Health Check: http://localhost:${PORT}/api/health`);
  console.info(`=================================================`);
});

// Initialize Socket.IO
initSocket(server);

// Initialize SLA Background Engine
initSlaCron();

// Handle graceful shutdown
const shutdown = (signal) => {
  console.info(`[Server] Received ${signal}. Closing HTTP server gracefully...`);
  stopSlaCron();
  server.close(() => {
    console.info('[Server] HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]', err);
});
