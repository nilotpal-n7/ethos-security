import { Router } from 'express';
import { getInactiveUserAlerts } from '../controllers/alertController';
// import { protect, authorizeAdmin } from '../middleware/authMiddleware';

const router = Router();

// Route to get all current inactivity alerts
router.get(
  '/inactive',
  // protect,
  // authorizeAdmin,
  getInactiveUserAlerts
);

export default router;