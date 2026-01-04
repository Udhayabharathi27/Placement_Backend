
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';

const router = Router();

// Configure multer for storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/resumes');
    },
    filename: (req, file, cb) => {
        // @ts-ignore
        const userId = (req as AuthRequest).user?.userId || 'unknown';
        cb(null, `resume-${userId}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

router.post('/resume', authenticate, authorize(['STUDENT']), upload.single('resume'), async (req: AuthRequest, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { userId } = req.user!;
        const resumeUrl = `/uploads/resumes/${req.file.filename}`;

        // Update student profile with resume URL
        await prisma.studentProfile.update({
            where: { userId },
            data: { resumeUrl }
        });

        res.json({
            message: 'Resume uploaded successfully',
            resumeUrl
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to upload resume' });
    }
});

export default router;
