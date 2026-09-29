import express from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import {
  validateRegister,
  validateLogin,
} from '../middlewares/authValidation.js';
import { loginLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', loginLimiter, validateLogin, login);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;
