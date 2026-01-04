import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { z } from 'zod';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['STUDENT', 'COMPANY', 'ADMIN']),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    companyName: z.string().optional(),
});

export const register = async (req: Request, res: Response) => {
    try {
        const data = registerSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                role: data.role,
                status: data.role === 'COMPANY' ? 'PENDING' : 'ACTIVE',
                studentProfile: data.role === 'STUDENT' ? {
                    create: {
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                    }
                } : undefined,
                companyProfile: data.role === 'COMPANY' ? {
                    create: {
                        companyName: data.companyName || '',
                    }
                } : undefined
            }
        });

        res.status(201).json({ message: 'User created successfully', userId: user.id });
    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Registration failed' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.status === 'BLOCKED') {
            return res.status(403).json({ error: 'Your account has been blocked. Please contact admin.' });
        }

        if (user.status === 'PENDING') {
            return res.status(403).json({ error: 'Your account is pending approval by the admin.' });
        }

        if (user.status === 'REJECTED') {
            return res.status(403).json({ error: 'Your registration request has been rejected.' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET as string || 'secret', { expiresIn: '1d' });

        let name = 'Admin User';
        if (user.role === 'STUDENT') {
            const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id } });
            name = profile ? `${profile.firstName} ${profile.lastName}` : 'Student';
        } else if (user.role === 'COMPANY') {
            const profile = await prisma.companyProfile.findUnique({ where: { userId: user.id } });
            name = profile ? profile.companyName : 'Company';
        }

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: name
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Login failed' });
    }
};
