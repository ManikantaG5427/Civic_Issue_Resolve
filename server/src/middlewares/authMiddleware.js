import User from '../models/User.js';
import { verifyAccessToken } from '../utils/tokenUtils.js';
import { AppError } from '../utils/appError.js';

/**
 * Middleware to protect routes and verify JWT bearer token
 */
export const protect = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header for Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(
        new AppError('You are not logged in. Please log in to gain access.', 401)
      );
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(
          new AppError('Your session has expired. Please log in again.', 401)
        );
      }
      return next(new AppError('Invalid authentication token.', 401));
    }

    // Check if user still exists
    const currentUser = await User.findById(decoded.id)
      .populate('serviceArea', 'name code city state pincodes centerLocation')
      .populate('department', 'name code icon');
    if (!currentUser) {
      return next(
        new AppError('The user belonging to this token no longer exists.', 401)
      );
    }

    // Check if user is active
    if (!currentUser.isActive) {
      return next(
        new AppError('Your account has been deactivated. Please contact support.', 403)
      );
    }

    // Attach user to request object
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware for optional authentication.
 * Attaches req.user if a valid token is provided, but does NOT block unauthenticated requests.
 */
export const optionalProtect = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = verifyAccessToken(token);
      const currentUser = await User.findById(decoded.id);
      if (currentUser && currentUser.isActive) {
        req.user = currentUser;
      } else {
        req.user = null;
      }
    } catch {
      req.user = null;
    }
    next();
  } catch {
    req.user = null;
    next();
  }
};
