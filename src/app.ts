import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
// @ts-ignore
import authRoutes from './routes/auth.routes';
// @ts-ignore
import jobRoutes from './routes/job.routes';
// @ts-ignore
// @ts-ignore
import analyticsRoutes from './routes/analytics.routes';
// @ts-ignore
// @ts-ignore
import applicationRoutes from './routes/application.routes';
// @ts-ignore
import studentRoutes from './routes/student.routes';
// @ts-ignore
import adminRoutes from './routes/admin.routes';
// @ts-ignore
import uploadRoutes from './routes/upload.routes';

const app: Express = express();

app.use(cors({
    origin: '*', // Allows all origins, you can replace with your Vercel URL for more security
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors()); // Enable pre-flight for all routes
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req: Request, res: Response) => {
    res.send('Placement Portal Backend is Running');
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
// Keep analytics for backward compatibility if needed, or remove
app.use('/api/analytics', analyticsRoutes);

export default app;
