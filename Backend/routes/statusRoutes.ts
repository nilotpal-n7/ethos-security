import { Router } from 'express';
import { param } from 'express-validator';
import { getStatus } from '../controllers/statusController';
import { validateRequest } from '../middleware/validatorMiddleware';
// import { protect, authorizeAdmin } from '../middleware/authMiddleware';

const router = Router();

// Route to get the current status and last known location of a user
router.get(
  '/:userId',
  // protect,
  // authorizeAdmin,
  param('userId').isInt({ min: 1 }).withMessage('User ID must be a positive integer.'),
  validateRequest,
  getStatus
);

export default router;