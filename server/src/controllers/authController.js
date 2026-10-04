import User from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/tokenUtils.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';

/**
 * Format sanitized user object for API responses
 */
const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  role: user.role,
  serviceArea: user.serviceArea || null,
  department: user.department || null,
  isActive: user.isActive,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
});

/**
 * Register a new citizen
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return next(new AppError('An account with this email already exists', 409));
    }

    // Create new citizen user (Role defaults to citizen)
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone ? phone.trim() : '',
      role: 'citizen',
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    return successResponse(
      res,
      'Registration successful',
      {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Log in existing user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user with password and security fields
    const user = await User.findOne({ email: normalizedEmail }).select(
      '+password +refreshToken'
    );

    if (!user) {
      // Log failed attempt audit
      console.warn(`[Audit: Failed Login] Non-existent email attempt: ${normalizedEmail}`);
      return next(new AppError('Invalid email or password', 401));
    }

    // Check if account is temporarily locked
    if (user.isLocked()) {
      const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return next(
        new AppError(
          `Account is temporarily locked due to too many failed attempts. Try again in ${remainingMinutes} minutes.`,
          423
        )
      );
    }

    // Check if active
    if (!user.isActive) {
      return next(
        new AppError('Your account has been deactivated. Please contact support.', 403)
      );
    }

    // Validate password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      user.failedLoginAttempts += 1;

      // Lock account for 15 minutes after 5 failed attempts
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        console.warn(
          `[Audit: Account Locked] User ${user.email} locked for 15 minutes after 5 failed attempts`
        );
      } else {
        console.warn(
          `[Audit: Failed Login] Incorrect password for ${user.email} (Attempt ${user.failedLoginAttempts}/5)`
        );
      }

      await user.save({ validateBeforeSave: false });
      return next(new AppError('Invalid email or password', 401));
    }

    // Reset failed login counters upon successful authentication
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    console.info(`[Audit: Login Success] User ${user.email} (${user.role}) logged in successfully`);

    return successResponse(
      res,
      'Login successful',
      {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh expired access token using refresh token
 * POST /api/auth/refresh
 */
export const refreshToken = async (req, res, next) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;

    if (!token) {
      return next(new AppError('Refresh token is required', 400));
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return next(new AppError('Invalid or expired refresh token. Please log in again.', 401));
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      return next(new AppError('Invalid refresh token. Please log in again.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated.', 403));
    }

    // Issue new access token and rotate refresh token
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return successResponse(
      res,
      'Token refreshed successfully',
      {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Log out user
 * POST /api/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
      console.info(`[Audit: Logout] User ${req.user.email} logged out`);
    }

    return successResponse(res, 'Logged out successfully', null, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset token
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(new AppError('Please provide your registered email address', 400));
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Check if user is present in database; if not, instruct them to register first
    if (!user) {
      return next(
        new AppError(
          'No account found with this email address. Please register first to create an account.',
          404
        )
      );
    }

    // Generate random 32-byte hex token and 1-hour expiration
    const { randomBytes, createHash } = await import('crypto');
    const resetToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    // Resolve client URL dynamically based on request origin/referer or config
    let dynamicClientUrl = process.env.CLIENT_URL || 'https://civicissueresolve-client.vercel.app';
    if (req.headers.origin && typeof req.headers.origin === 'string' && req.headers.origin.startsWith('http')) {
      dynamicClientUrl = req.headers.origin;
    } else if (req.headers.referer && typeof req.headers.referer === 'string') {
      try {
        dynamicClientUrl = new URL(req.headers.referer).origin;
      } catch {
        // Fall back to default dynamicClientUrl
      }
    }

    const clientUrl = dynamicClientUrl.replace(/\/$/, '');
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const { sendPasswordResetEmail } = await import('../services/emailService.js');
    let dispatchResult = null;
    try {
      dispatchResult = await sendPasswordResetEmail(user.email, user.name, resetUrl);
    } catch (emailError) {
      console.error(`[Email Dispatch Failure] Error delivering reset email to ${user.email}:`, emailError.message);
      // Still keep reset token alive for 1 hour so the user or admin can use the valid reset link
    }

    const isSimulated = dispatchResult?.simulated;
    const message = isSimulated
      ? `A password reset link has been created for ${user.email}. (Valid for 1 hour)`
      : `A password reset link has been successfully dispatched to ${user.email}. Please check your inbox.`;

    return successResponse(
      res,
      message,
      {
        resetUrl: isSimulated || process.env.NODE_ENV === 'development' ? resetUrl : undefined,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using signed reset token
 * POST /api/auth/reset-password/:token
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return next(new AppError('Password must be at least 6 characters long', 400));
    }

    const { createHash } = await import('crypto');
    const hashedToken = createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return next(new AppError('Password reset link is invalid or has expired', 400));
    }

    // Set new password (will be automatically hashed by pre-save hook)
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    console.info(`[Password Reset Completed] User: ${user.email} successfully updated password.`);

    return successResponse(
      res,
      'Password reset successfully. You can now log in with your new password.',
      null,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get current logged in user details
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
  return successResponse(
    res,
    'Current user profile retrieved',
    { user: sanitizeUser(req.user) },
    200
  );
};

