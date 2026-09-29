import { AppError } from '../utils/appError.js';

/**
 * Validation middleware for user registration
 */
export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || !emailRegex.test(email.trim())) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 6 characters long',
    });
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed', 400, errors));
  }

  next();
};

/**
 * Validation middleware for user login
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push({ field: 'email', message: 'Email address is required' });
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (errors.length > 0) {
    return next(new AppError('Please provide both email and password', 400, errors));
  }

  next();
};
