import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';

// Load environment variables
dotenv.config();

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

// Handle graceful shutdown
const shutdown = (signal) => {
  console.info(`[Server] Received ${signal}. Closing HTTP server gracefully...`);
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
