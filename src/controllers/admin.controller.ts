import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { z } from 'zod';

const userStatusSchema = z.object({
    status: z.enum(['ACTIVE', 'BLOCKED', 'PENDING', 'REJECTED']),
});

export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                studentProfile: true,
                companyProfile: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(users);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const updateUserStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = userStatusSchema.parse(req.body);

        const user = await prisma.user.update({
            where: { id },
            data: { status },
        });

        res.json(user);
    } catch (error: any) {
        res.status(400).json({ error: 'Failed to update user status' });
    }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // First delete associated profiles due to cascade or manual cleanup
        await prisma.studentProfile.deleteMany({ where: { userId: id } });
        await prisma.companyProfile.deleteMany({ where: { userId: id } });

        await prisma.user.delete({ where: { id } });

        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

export const getPlacementReport = async (req: AuthRequest, res: Response) => {
    try {
        const applications = await prisma.application.findMany({
            include: {
                job: {
                    include: { company: true },
                },
                student: {
                    include: { user: { select: { email: true } } },
                },
            },
            orderBy: { appliedAt: 'desc' },
        });

        // Format for a report
        const report = applications.map((app) => ({
            studentName: `${app.student.firstName} ${app.student.lastName}`,
            studentEmail: app.student.user.email,
            companyName: app.job.company.companyName,
            jobTitle: app.job.title,
            status: app.status,
            appliedAt: app.appliedAt,
        }));

        res.json(report);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to generate report' });
    }
};
