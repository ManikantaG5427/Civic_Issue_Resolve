import { getDBState } from '../config/db.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * Controller to handle API health check
 */
export const getHealth = (req, res) => {
  const dbStatus = getDBState();
  const uptimeSeconds = Math.floor(process.uptime());
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  const healthData = {
    service: 'CivicResolve Backend API',
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    phase: 'Phase 2: Real-Time Platform Systems & Advanced Services (100% Complete)',
    uptime: `${hours}h ${minutes}m ${seconds}s`,
    database: {
      status: dbStatus,
      connected: dbStatus === 'connected',
    },
    capabilities: {
      auth: true,
      rbac: true,
      socketRealTime: true,
      comments: true,
      geospatialDuplicates: true,
      slaBackgroundCron: true,
      analytics: true,
      publicMap: true,
    },
    memoryUsage: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    },
    timestamp: new Date().toISOString(),
  };

  return successResponse(res, 'CivicResolve API is fully operational', healthData, 200);
};
