import { Router } from 'express';
// @ts-ignore
import { getPlacementStats, getStudentDashboardStats, getCompanyDashboardStats } from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/stats', authenticate, authorize(['ADMIN']), getPlacementStats);
router.get('/student', authenticate, authorize(['STUDENT']), getStudentDashboardStats);
router.get('/company', authenticate, authorize(['COMPANY']), getCompanyDashboardStats);

export default router;
