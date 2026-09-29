import { AppError } from '../utils/appError.js';

/**
 * Middleware to restrict access to specified roles
 * @param  {...string} allowedRoles - e.g. 'administrator', 'super_admin', 'field_worker', 'citizen'
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new AppError('Authentication required to verify permissions', 401)
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden: Role '${req.user.role}' is not authorized to access this resource`,
          403
        )
      );
    }

    next();
  };
};

/**
 * Verify if the logged-in user owns the resource or has an elevated administrative role
 * @param {Function} getOwnerIdFn - Function extracting the owner's ObjectId from request
 * @param  {...string} bypassRoles - Roles that can bypass ownership check (e.g. 'administrator', 'super_admin')
 */
export const requireOwnershipOrRole = (
  getOwnerIdFn,
  bypassRoles = ['administrator', 'super_admin']
) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Admins and Super Admins bypass ownership check
    if (bypassRoles.includes(req.user.role)) {
      return next();
    }

    const ownerId = getOwnerIdFn(req);
    if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
      return next(
        new AppError(
          'Access forbidden: You do not have permission to access or modify this resource',
          403
        )
      );
    }

    next();
  };
};

/**
 * Verify if administrator or worker has access to the specified service area
 */
export const requireServiceAreaMatch = (getServiceAreaIdFn) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Super Admin has global access across all service areas
    if (req.user.role === 'super_admin') {
      return next();
    }

    const targetServiceAreaId = getServiceAreaIdFn(req);

    // If user has no assigned service area and target requires one
    if (!req.user.serviceArea || req.user.serviceArea.toString() !== targetServiceAreaId?.toString()) {
      return next(
        new AppError(
          'Access forbidden: You are not authorized for this service area',
          403
        )
      );
    }

    next();
  };
};
