import { Router } from 'express';
// @ts-ignore
import { createJob, getJobs, getJobById, updateJob, deleteJob, getMyJobs } from '../controllers/job.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, authorize(['COMPANY', 'ADMIN']), createJob);
router.get('/', authenticate, getJobs);
router.get('/my-jobs', authenticate, authorize(['COMPANY']), getMyJobs);
router.get('/:id', authenticate, getJobById);
router.put('/:id', authenticate, authorize(['COMPANY', 'ADMIN']), updateJob);
router.delete('/:id', authenticate, authorize(['COMPANY', 'ADMIN']), deleteJob);

export default router;
