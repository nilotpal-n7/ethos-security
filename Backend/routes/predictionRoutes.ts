import { Router } from 'express';
import { param } from 'express-validator';
import { getPrediction } from '../controllers/predictionController';
import { validateRequest } from '../middleware/validatorMiddleware';
// import { protect, authorizeAdmin } from '../middleware/authMiddleware';

const router = Router();

// Route to get a prediction for a user's next location
router.get(
  '/:userId',
  // protect,
  // authorizeAdmin,
  param('userId').isInt({ min: 1 }).withMessage('User ID must be a positive integer.'),
  validateRequest,
  getPrediction
);

export default router;