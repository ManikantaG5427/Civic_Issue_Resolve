import User from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/tokenUtils.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';

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
  isEmailVerified: user.isEmailVerified ?? true,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
});

/**
 * Register a new citizen (Generates 6-digit email verification code)
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already registered
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (!existingUser.isEmailVerified) {
        // User started registration earlier but did not verify. Generate fresh code.
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        existingUser.name = name.trim();
        existingUser.password = password;
        existingUser.phone = phone ? phone.trim() : '';
        existingUser.emailVerificationCode = newCode;
        existingUser.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        await existingUser.save();

        await sendVerificationEmail(existingUser.email, existingUser.name, newCode);

        return successResponse(
          res,
          'A new 6-digit verification code has been sent to your email.',
          {
            requireVerification: true,
            email: existingUser.email,
          },
          200
        );
      }
      return next(new AppError('An account with this email already exists. Please sign in.', 409));
    }

    const isSuperAdminEmail = normalizedEmail === 'gundrothumanikantad@gmail.com';

    // If primary Super Admin email, immediately activate with super_admin role
    if (isSuperAdminEmail) {
      const user = new User({
        name: name.trim() || 'Manikanta Super Admin',
        email: normalizedEmail,
        password,
        phone: phone ? phone.trim() : '',
        role: 'super_admin',
        isEmailVerified: true,
      });

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      user.refreshToken = refreshToken;
      user.lastLogin = new Date();
      await user.save();

      return successResponse(
        res,
        'Super Admin registered successfully! Welcome Manikanta.',
        {
          user: sanitizeUser(user),
          accessToken,
          refreshToken,
          requireVerification: false,
        },
        201
      );
    }

    // Generate 6-digit OTP verification code for citizens
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create new unverified citizen user
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: phone ? phone.trim() : '',
      role: 'citizen',
      isEmailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
    });

    await user.save();

    // Dispatch verification code to citizen's inbox
    await sendVerificationEmail(user.email, user.name, verificationCode);

    return successResponse(
      res,
      'Registration successful! Please enter the 6-digit verification code sent to your email to activate your account.',
      {
        requireVerification: true,
        email: user.email,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Verify 6-digit Email Verification Code
 * POST /api/auth/verify-email
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return next(new AppError('Please provide both your registered email and 6-digit code', 400));
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+emailVerificationCode +emailVerificationExpires +refreshToken'
    );

    if (!user) {
      return next(new AppError('No account found with this email address', 404));
    }

    if (user.isEmailVerified) {
      return successResponse(res, 'Your email is already verified. You can now log in.', {
        alreadyVerified: true,
      });
    }

    if (
      !user.emailVerificationCode ||
      user.emailVerificationCode !== cleanCode ||
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      return next(
        new AppError('Invalid or expired 6-digit verification code. Please request a new code.', 400)
      );
    }

    // Activate and mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    user.lastLogin = new Date();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    console.info(`[Email Verification Success] User ${user.email} verified account successfully.`);

    return successResponse(
      res,
      'Email verified successfully! Welcome to CivicResolve.',
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
 * Resend Email Verification Code
 * POST /api/auth/resend-verification
 */
export const resendVerificationCode = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(new AppError('Please provide your registered email address', 400));
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select(
      '+emailVerificationCode +emailVerificationExpires'
    );

    if (!user) {
      return next(new AppError('No account found with this email address', 404));
    }

    if (user.isEmailVerified) {
      return next(new AppError('This email is already verified. Please sign in.', 400));
    }

    // Generate new code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await sendVerificationEmail(user.email, user.name, verificationCode);

    return successResponse(
      res,
      'A fresh 6-digit verification code has been dispatched to your email.',
      { email: user.email },
      200
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

    // Check if email is verified (Super Admins, Admins, and Staff never need OTP)
    const isExemptFromOtp =
      user.role === 'super_admin' ||
      user.role === 'administrator' ||
      user.role === 'field_worker' ||
      user.email === 'gundrothumanikantad@gmail.com';

    if (user.isEmailVerified === false && !isExemptFromOtp) {
      // Generate code and send email only for regular unverified citizens
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.emailVerificationCode = verificationCode;
      user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save({ validateBeforeSave: false });

      await sendVerificationEmail(user.email, user.name, verificationCode);

      return res.status(403).json({
        success: false,
        requireVerification: true,
        email: user.email,
        message: 'Your email is not verified yet. We have sent a 6-digit verification code to your email.',
      });
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
 * Request password reset token (Sends email with secure reset link)
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

    // Check if user exists in database
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
        // Fall back
      }
    }

    const clientUrl = dynamicClientUrl.replace(/\/$/, '');
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    // Dispatch password reset email
    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    return successResponse(
      res,
      `A password reset link has been dispatched to ${user.email}. Please check your inbox to proceed with resetting your password.`,
      null,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using signed reset token from email
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

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.isEmailVerified = true; // Password reset confirms email ownership
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
