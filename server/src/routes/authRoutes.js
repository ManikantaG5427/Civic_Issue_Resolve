import express from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import {
  validateRegister,
  validateLogin,
} from '../middlewares/authValidation.js';
import { loginLimiter, registerLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/register', registerLimiter, validateRegister, register);
router.post('/login', loginLimiter, validateLogin, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;

