import { Router } from 'express';
// @ts-ignore
import { getMyProfile, updateMyProfile } from '../controllers/student.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/profile', authenticate, authorize(['STUDENT']), getMyProfile);
router.put('/profile', authenticate, authorize(['STUDENT']), updateMyProfile);

export default router;
