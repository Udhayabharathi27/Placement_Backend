import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { z } from 'zod';

const updateStudentProfileSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    about: z.string().optional(),
    university: z.string().optional(),
    graduationYear: z.string().optional(),
    skills: z.array(z.string()).optional(),
});

export const getMyProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.user!;

        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        email: true,
                        role: true
                    }
                }
            }
        });

        if (!studentProfile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json(studentProfile);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.user!;
        const data = updateStudentProfileSchema.parse(req.body);

        const updatedProfile = await prisma.studentProfile.update({
            where: { userId },
            data: {
                ...data
            }
        });

        res.json(updatedProfile);
    } catch (error: any) {
        res.status(400).json({ error: 'Failed to update profile' });
    }
};
