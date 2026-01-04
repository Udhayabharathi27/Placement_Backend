import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { sendStatusUpdateEmail } from '../utils/email';

const applicationUpdateSchema = z.object({
    status: z.enum(['APPLIED', 'SHORTLISTED', 'REJECTED', 'HIRED']),
});

export const applyToJob = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.user!;
        const { jobId } = req.body;

        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId }
        });

        if (!studentProfile) {
            return res.status(404).json({ error: 'Student profile not found' });
        }

        const application = await prisma.application.create({
            data: {
                jobId,
                studentId: studentProfile.id
            }
        });

        res.status(201).json(application);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Already applied to this job' });
        }
        res.status(400).json({ error: 'Failed to apply for job' });
    }
};

export const getMyApplications = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.user!;
        const studentProfile = await prisma.studentProfile.findUnique({ where: { userId } });

        if (!studentProfile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        const applications = await prisma.application.findMany({
            where: { studentId: studentProfile.id },
            include: {
                job: {
                    select: {
                        title: true,
                        company: { select: { companyName: true } }
                    }
                }
            },
            orderBy: { appliedAt: 'desc' }
        });

        res.json(applications);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
};

export const getJobApplications = async (req: AuthRequest, res: Response) => {
    try {
        const { jobId } = req.params;
        const { userId } = req.user!;

        // Verify company ownership of job
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            include: { company: true }
        });

        if (!job) return res.status(404).json({ error: 'Job not found' });

        if (req.user?.role !== 'ADMIN') {
            const companyProfile = await prisma.companyProfile.findUnique({ where: { userId } });
            if (!companyProfile || job.companyId !== companyProfile.id) {
                return res.status(403).json({ error: 'Not authorized to view these applications' });
            }
        }

        const applications = await prisma.application.findMany({
            where: { jobId },
            include: {
                student: {
                    include: { user: { select: { email: true } } }
                }
            },
            orderBy: { appliedAt: 'desc' }
        });

        res.json(applications);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
};

export const getAllCompanyApplications = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.user!;

        // Get company profile
        const companyProfile = await prisma.companyProfile.findUnique({
            where: { userId }
        });

        if (!companyProfile) {
            return res.status(404).json({ error: 'Company profile not found' });
        }

        // Get all jobs for this company
        const jobs = await prisma.job.findMany({
            where: { companyId: companyProfile.id },
            select: { id: true }
        });

        const jobIds = jobs.map(job => job.id);

        // Get all applications for these jobs
        const applications = await prisma.application.findMany({
            where: {
                jobId: { in: jobIds }
            },
            include: {
                job: {
                    select: {
                        title: true,
                        description: true
                    }
                },
                student: {
                    include: {
                        user: {
                            select: {
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: { appliedAt: 'desc' }
        });

        res.json(applications);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
};

export const updateApplicationStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { userId } = req.user!;
        const data = applicationUpdateSchema.parse(req.body);

        const application = await prisma.application.findUnique({
            where: { id },
            include: {
                job: {
                    include: { company: true }
                },
                student: {
                    include: { user: { select: { email: true } } }
                }
            }
        });

        if (!application) return res.status(404).json({ error: 'Application not found' });

        // Verify company ownership
        if (req.user?.role !== 'ADMIN') {
            const companyProfile = await prisma.companyProfile.findUnique({ where: { userId } });
            if (!companyProfile || application.job.companyId !== companyProfile.id) {
                return res.status(403).json({ error: 'Not authorized to update this application' });
            }
        }

        const updatedApplication = await prisma.application.update({
            where: { id },
            data: { status: data.status }
        });

        // Send Email Notification (Async)
        sendStatusUpdateEmail(
            application.student.user.email,
            `${application.student.firstName} ${application.student.lastName}`,
            application.job.title,
            application.job.company.companyName,
            data.status
        );

        res.json(updatedApplication);
    } catch (error: any) {
        res.status(400).json({ error: 'Failed to update application status' });
    }
};
