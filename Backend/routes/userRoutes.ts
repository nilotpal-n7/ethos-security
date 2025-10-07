import { Router } from 'express';
import { getUsers } from '../controllers/userController';
// import { protect } from '../middleware/authMiddleware'; // Uncomment when auth is ready

const router = Router();

// Route to get all users
// This endpoint will be hit by the frontend to populate the user selection dropdown.
router.get(
  '/', 
  // protect, // This route should be protected
  getUsers
);

export default router;
