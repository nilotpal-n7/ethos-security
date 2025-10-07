import { Router } from 'express';
import { param } from 'express-validator';
import { getTimeline } from '../controllers/timelineController';
import { validateRequest } from '../middleware/validatorMiddleware';
// import { protect, authorizeAdmin } from '../middleware/authMiddleware';

const router = Router();

// Route to get a detailed timeline for a single user by their ID
router.get(
  '/:userId',
  // protect,          // Ensure user is logged in
  // authorizeAdmin,   // Ensure user has clearance for this sensitive data
  param('userId').isInt({ min: 1 }).withMessage('User ID must be a positive integer.'),
  validateRequest,  // Middleware to check for validation errors
  getTimeline
);

export default router;