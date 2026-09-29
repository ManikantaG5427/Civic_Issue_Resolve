import rateLimit from 'express-rate-limit';

/**
 * Rate limiter specifically for login attempts to prevent brute force attacks
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per 15 min window
  message: {
    success: false,
    status: 'fail',
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    status: 'fail',
    message: 'Too many requests from this IP, please try again later',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});
