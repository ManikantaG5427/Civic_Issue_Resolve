import { getDBState } from '../config/db.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * Controller to handle API health check
 */
export const getHealth = (req, res) => {
  const dbStatus = getDBState();
  const uptimeSeconds = Math.floor(process.uptime());

  const healthData = {
    service: 'CivicResolve Backend API',
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    queueStage: 'Queue 0: Project Foundation',
    uptime: `${uptimeSeconds}s`,
    database: {
      status: dbStatus,
      connected: dbStatus === 'connected',
    },
    memoryUsage: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    },
  };

  return successResponse(res, 'CivicResolve API is fully operational', healthData, 200);
};
