import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';

export const getPlacementStats = async (req: AuthRequest, res: Response) => {
    try {
        const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
        const totalCompanies = await prisma.user.count({ where: { role: 'COMPANY' } });
        const totalJobs = await prisma.job.count();
        const totalApplications = await prisma.application.count();
        const placedStudents = await prisma.application.count({ where: { status: 'HIRED' } });

        res.json({
            totalStudents,
            totalCompanies,
            totalJobs,
            totalApplications,
            placedStudents
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};

export const getStudentDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.user!;
        const student = await prisma.studentProfile.findUnique({ where: { userId } });

        if (!student) return res.status(404).json({ error: 'Student not found' });

        const stats = await prisma.application.groupBy({
            by: ['status'],
            where: { studentId: student.id },
            _count: true
        });

        const totalApplied = await prisma.application.count({ where: { studentId: student.id } });
        const hiredCount = stats.find(s => s.status === 'HIRED')?._count || 0;
        const shortlistedCount = stats.find(s => s.status === 'SHORTLISTED')?._count || 0;
        const rejectedCount = stats.find(s => s.status === 'REJECTED')?._count || 0;

        const recentApplications = await prisma.application.findMany({
            where: { studentId: student.id },
            include: { job: { include: { company: true } } },
            orderBy: { appliedAt: 'desc' },
            take: 5
        });

        res.json({
            totalApplied,
            hiredCount,
            shortlistedCount,
            rejectedCount,
            recentApplications
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch student stats' });
    }
};

export const getCompanyDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.user!;
        const company = await prisma.companyProfile.findUnique({ where: { userId } });

        if (!company) return res.status(404).json({ error: 'Company not found' });

        const totalJobs = await prisma.job.count({ where: { companyId: company.id } });
        const openJobs = await prisma.job.count({ where: { companyId: company.id, status: 'OPEN' } });

        const apps = await prisma.application.findMany({
            where: { job: { companyId: company.id } },
            select: { status: true }
        });

        const totalApps = apps.length;
        const hiredCount = apps.filter(a => a.status === 'HIRED').length;
        const shortlistedCount = apps.filter(a => a.status === 'SHORTLISTED').length;

        const recentApplications = await prisma.application.findMany({
            where: { job: { companyId: company.id } },
            include: { job: true, student: true },
            orderBy: { appliedAt: 'desc' },
            take: 5
        });

        res.json({
            totalJobs,
            openJobs,
            totalApps,
            hiredCount,
            shortlistedCount,
            recentApplications
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch company stats' });
    }
};
