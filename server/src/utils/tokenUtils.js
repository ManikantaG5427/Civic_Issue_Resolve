import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.JWT_SECRET || 'civicresolve_dev_jwt_super_secret_access_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'civicresolve_dev_jwt_super_secret_refresh_key_2026';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate short-lived Access Token
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      serviceArea: user.serviceArea || null,
      department: user.department || null,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Generate long-lived Refresh Token
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
    },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
};

/**
 * Verify Access Token
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};
