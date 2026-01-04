import { Router } from 'express';
// @ts-ignore
import { applyToJob, getMyApplications, getJobApplications, updateApplicationStatus, getAllCompanyApplications } from '../controllers/application.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Student routes
router.post('/apply', authenticate, authorize(['STUDENT']), applyToJob);
router.get('/my-applications', authenticate, authorize(['STUDENT']), getMyApplications);

// Company/Admin routes
router.get('/company/all', authenticate, authorize(['COMPANY', 'ADMIN']), getAllCompanyApplications);
router.get('/job/:jobId', authenticate, authorize(['COMPANY', 'ADMIN']), getJobApplications);
router.put('/:id/status', authenticate, authorize(['COMPANY', 'ADMIN']), updateApplicationStatus);

export default router;
