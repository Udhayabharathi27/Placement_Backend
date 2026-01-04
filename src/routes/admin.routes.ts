import { Router } from 'express';
// @ts-ignore
import { getAllUsers, updateUserStatus, deleteUser, getPlacementReport } from '../controllers/admin.controller';
import { getPlacementStats } from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Stats for dashboard
router.get('/stats', authenticate, authorize(['ADMIN']), getPlacementStats);

// User management
router.get('/users', authenticate, authorize(['ADMIN']), getAllUsers);
router.put('/users/:id/status', authenticate, authorize(['ADMIN']), updateUserStatus);
router.delete('/users/:id', authenticate, authorize(['ADMIN']), deleteUser);

// Reporting
router.get('/reports/placement', authenticate, authorize(['ADMIN']), getPlacementReport);

export default router;
