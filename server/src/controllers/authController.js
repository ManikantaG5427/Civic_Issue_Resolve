import User from '../models/User.js';
import PendingRegistration from '../models/PendingRegistration.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/tokenUtils.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { notifySuperAdmin } from '../services/notificationService.js';

/**
 * Format sanitized user object for API responses
 */
const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  role: user.role,
  requestedRole: user.requestedRole || user.role,
  approvalStatus: user.approvalStatus || 'approved',
  serviceArea: user.serviceArea || null,
  department: user.department || null,
  isActive: user.isActive,
  isEmailVerified: user.isEmailVerified ?? true,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
});

/**
 * Register a new citizen
 * Secure holding: Stores temporarily in PendingRegistration until OTP is verified.
 * NO permanent User document is created in database until email is verified!
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already registered in permanent User database
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return next(new AppError('An account with this email already exists. Please sign in.', 409));
    }

    const isSuperAdminEmail = normalizedEmail === 'gundrothumanikantad@gmail.com';

    // If primary Super Admin email, immediately create super_admin with zero OTP required
    if (isSuperAdminEmail) {
      let user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        user = new User({
          name: name?.trim() || 'Manikanta Super Admin',
          email: normalizedEmail,
          password,
          phone: phone ? phone.trim() : '',
          role: 'super_admin',
          requestedRole: 'super_admin',
          approvalStatus: 'approved',
          isEmailVerified: true,
        });
      } else {
        user.password = password;
        user.role = 'super_admin';
        user.requestedRole = 'super_admin';
        user.approvalStatus = 'approved';
        user.isEmailVerified = true;
      }

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

    // Validate selected role
    const validRoles = ['citizen', 'field_worker', 'administrator'];
    const chosenRole = validRoles.includes(role) ? role : 'citizen';

    // Generate 6-digit OTP verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store temporarily in PendingRegistration collection (NOT in permanent User database)
    await PendingRegistration.findOneAndUpdate(
      { email: normalizedEmail },
      {
        name: name.trim(),
        email: normalizedEmail,
        password,
        phone: phone ? phone.trim() : '',
        role: chosenRole,
        verificationCode,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins expiry
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Dispatch verification code to recipient's inbox
    await sendVerificationEmail(normalizedEmail, name.trim(), verificationCode);

    return successResponse(
      res,
      'Registration initiated! Please enter the 6-digit verification code sent to your email to activate your account.',
      {
        requireVerification: true,
        email: normalizedEmail,
        role: chosenRole,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Verify 6-digit Email Verification Code
 * Handles both:
 * 1. Pending registrations (creates new User record)
 * 2. Existing unverified users in User collection
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

    // 1. Check PendingRegistration collection
    const pending = await PendingRegistration.findOne({ email: normalizedEmail });

    if (pending) {
      // Check code match and expiry
      if (
        pending.verificationCode !== cleanCode ||
        !pending.expiresAt ||
        pending.expiresAt < new Date()
      ) {
        return next(
          new AppError('Invalid or expired 6-digit verification code. Please request a new code.', 400)
        );
      }

      const isStaffRole = pending.role === 'administrator' || pending.role === 'field_worker';

      // CREATE THE PERMANENT USER DOCUMENT IN DATABASE NOW
      const user = new User({
        name: pending.name,
        email: pending.email,
        password: pending.password, // Pre-save hook will hash it
        phone: pending.phone || '',
        role: isStaffRole ? 'citizen' : 'citizen', // Safe default until Super Admin approves staff
        requestedRole: pending.role || 'citizen',
        approvalStatus: isStaffRole ? 'pending' : 'approved',
        isEmailVerified: true,
        lastLogin: new Date(),
      });

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      user.refreshToken = refreshToken;

      await user.save();

      // Clean up temporary pending record
      await PendingRegistration.deleteOne({ _id: pending._id });

      console.info(`[Security: User Verified & Created in DB] User ${user.email} (${user.requestedRole}) added to database.`);

      // Trigger Real-Time Super Admin Notification & Email Alert
      if (isStaffRole) {
        notifySuperAdmin({
          eventType: 'staff_request',
          title: `📋 Staff Role Application: ${user.name}`,
          message: `${user.name} (${user.email}) verified their account and requested the ${user.requestedRole.replace('_', ' ').toUpperCase()} role. Please review and assign jurisdictional coverage.`,
          actor: user,
          metadata: {
            'Requested Role': user.requestedRole.replace('_', ' '),
            'Account Status': 'Pending Super Admin Approval',
            'Phone': user.phone || 'N/A',
          },
          linkUrl: '/dashboard',
          req,
        });
      } else {
        notifySuperAdmin({
          eventType: 'user_register',
          title: `🎉 New Citizen Registered: ${user.name}`,
          message: `${user.name} (${user.email}) successfully verified their email and activated a citizen account.`,
          actor: user,
          metadata: {
            'Registered Role': 'Citizen',
            'Phone': user.phone || 'N/A',
          },
          linkUrl: '/dashboard',
          req,
        });
      }

      return successResponse(
        res,
        'Email verified successfully! Your account is now active.',
        {
          user: sanitizeUser(user),
          accessToken,
          refreshToken,
          pendingApproval: isStaffRole,
        },
        200
      );
    }

    // 2. Check if user already exists in permanent User collection with unverified email
    const existingUser = await User.findOne({ email: normalizedEmail }).select(
      '+emailVerificationCode +emailVerificationExpires +refreshToken'
    );

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return successResponse(res, 'Your email is already verified. You can now log in directly.', {
          alreadyVerified: true,
        });
      }

      // Check OTP match for existing unverified user
      if (
        !existingUser.emailVerificationCode ||
        existingUser.emailVerificationCode !== cleanCode ||
        !existingUser.emailVerificationExpires ||
        existingUser.emailVerificationExpires < new Date()
      ) {
        return next(
          new AppError('Invalid or expired 6-digit verification code. Please request a new code.', 400)
        );
      }

      // Mark verified
      existingUser.isEmailVerified = true;
      existingUser.emailVerificationCode = undefined;
      existingUser.emailVerificationExpires = undefined;
      existingUser.lastLogin = new Date();

      const accessToken = generateAccessToken(existingUser);
      const refreshToken = generateRefreshToken(existingUser);
      existingUser.refreshToken = refreshToken;

      await existingUser.save({ validateBeforeSave: false });

      return successResponse(
        res,
        'Email verified successfully! You are now logged in.',
        {
          user: sanitizeUser(existingUser),
          accessToken,
          refreshToken,
        },
        200
      );
    }

    return next(
      new AppError('No registration found for this email. Please register first.', 404)
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
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 1. Check PendingRegistration
    const pending = await PendingRegistration.findOne({ email: normalizedEmail });
    if (pending) {
      pending.verificationCode = verificationCode;
      pending.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await pending.save();

      await sendVerificationEmail(pending.email, pending.name, verificationCode);

      return successResponse(
        res,
        'A fresh 6-digit verification code has been dispatched to your email.',
        { email: pending.email },
        200
      );
    }

    // 2. Check existing unverified User
    const existingUser = await User.findOne({ email: normalizedEmail }).select(
      '+emailVerificationCode +emailVerificationExpires'
    );

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return next(new AppError('This email is already verified. Please sign in.', 400));
      }

      existingUser.emailVerificationCode = verificationCode;
      existingUser.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
      await existingUser.save({ validateBeforeSave: false });

      await sendVerificationEmail(existingUser.email, existingUser.name, verificationCode);

      return successResponse(
        res,
        'A fresh 6-digit verification code has been dispatched to your email.',
        { email: existingUser.email },
        200
      );
    }

    return next(
      new AppError('No account found for this email. Please register first.', 404)
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

    // Trigger Real-Time Super Admin Notification & Email Alert
    notifySuperAdmin({
      eventType: 'user_login',
      title: `🔑 User Session Login: ${user.name}`,
      message: `${user.name} (${user.email}) logged into the platform as ${user.role.replace('_', ' ')}.`,
      actor: user,
      metadata: {
        'Active Role': user.role,
        'Account Status': user.approvalStatus || 'approved',
        'Service Area': user.serviceArea?.name || 'Default Zone',
      },
      linkUrl: '/dashboard',
      req,
    });

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

    // Resolve client URL securely from trusted origins
    const trustedOrigins = [
      'https://civicissueresolve-client.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
    ];
    if (process.env.CLIENT_URL) {
      trustedOrigins.push(process.env.CLIENT_URL.replace(/\/$/, ''));
    }

    let dynamicClientUrl = process.env.CLIENT_URL || 'https://civicissueresolve-client.vercel.app';
    const originHeader = req.headers.origin;
    if (originHeader && trustedOrigins.includes(originHeader.replace(/\/$/, ''))) {
      dynamicClientUrl = originHeader;
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
    user.isEmailVerified = true;
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

/**
 * Update user profile (Name, Phone)
 * PATCH /api/auth/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (name && typeof name === 'string' && name.trim().length >= 2) {
      user.name = name.trim();
    }

    if (phone !== undefined) {
      user.phone = phone ? phone.trim() : '';
    }

    await user.save({ validateBeforeSave: false });

    const updatedUser = await User.findById(user._id)
      .populate('serviceArea', 'name code city state pincodes centerLocation')
      .populate('department', 'name code icon');

    return successResponse(
      res,
      'Profile updated successfully',
      { user: sanitizeUser(updatedUser) },
      200
    );
  } catch (error) {
    next(error);
  }
};
