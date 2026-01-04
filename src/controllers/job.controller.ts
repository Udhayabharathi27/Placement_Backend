import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { z } from 'zod';

const jobSchema = z.object({
    title: z.string(),
    description: z.string(),
    requirements: z.string(),
    // @ts-ignore
    location: z.string().optional(),
    // @ts-ignore
    salary: z.string().optional(),
});

export const createJob = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.user!;
        const data = jobSchema.parse(req.body);

        const companyProfile = await prisma.companyProfile.findUnique({
            where: { userId }
        });

        if (!companyProfile) {
            return res.status(404).json({ error: 'Company profile not found' });
        }

        const job = await prisma.job.create({
            data: {
                title: data.title,
                description: data.description,
                requirements: data.requirements,
                companyId: companyProfile.id,
                // Optional fields handling
                location: data.location,
                salary: data.salary
            }
        });

        res.status(201).json(job);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getMyJobs = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.user!;
        const companyProfile = await prisma.companyProfile.findUnique({
            where: { userId }
        });

        if (!companyProfile) {
            return res.status(404).json({ error: 'Company profile not found' });
        }

        const jobs = await prisma.job.findMany({
            where: { companyId: companyProfile.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(jobs);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch your jobs' });
    }
};

export const getJobs = async (req: AuthRequest, res: Response) => {
    try {
        const jobs = await prisma.job.findMany({
            where: {
                company: {
                    user: {
                        status: 'ACTIVE'
                    }
                }
            },
            include: { company: { select: { companyName: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(jobs);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
};

export const getJobById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const job = await prisma.job.findUnique({
            where: { id },
            include: { company: { select: { companyName: true } } }
        });

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json(job);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch job' });
    }
};

export const updateJob = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { userId } = req.user!;
        const data = req.body;

        const job = await prisma.job.findUnique({ where: { id } });

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Verify ownership
        if (req.user?.role !== 'ADMIN') {
            const companyProfile = await prisma.companyProfile.findUnique({ where: { userId } });
            if (!companyProfile || job.companyId !== companyProfile.id) {
                return res.status(403).json({ error: 'Not authorized to update this job' });
            }
        }

        const updatedJob = await prisma.job.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                requirements: data.requirements,
                location: data.location,
                salary: data.salary,
                status: data.status
            }
        });

        res.json(updatedJob);
    } catch (error: any) {
        res.status(400).json({ error: 'Failed to update job' });
    }
};

export const deleteJob = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { userId } = req.user!;

        const job = await prisma.job.findUnique({ where: { id } });

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Verify ownership
        if (req.user?.role !== 'ADMIN') {
            const companyProfile = await prisma.companyProfile.findUnique({ where: { userId } });
            if (!companyProfile || job.companyId !== companyProfile.id) {
                return res.status(403).json({ error: 'Not authorized to delete this job' });
            }
        }

        // Delete associated applications first
        await prisma.application.deleteMany({ where: { jobId: id } });

        await prisma.job.delete({ where: { id } });
        res.json({ message: 'Job deleted successfully' });
    } catch (error: any) {
        console.error('Delete job error:', error);
        res.status(500).json({ error: 'Failed to delete job' });
    }
};
