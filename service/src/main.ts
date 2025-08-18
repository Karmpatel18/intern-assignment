import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { config } from './config';
import authRouter from './routes/auth';
import testsRouter from './routes/tests';
import submissionsRouter from './routes/submissions';
import templatesRouter from './routes/templates';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health
app.get('/health', (_req: Request, res: Response) => {
	res.json({ ok: true, service: 'assessment-service' });
});

// Routers
app.use('/api/auth', authRouter);
app.use('/api/tests', testsRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/templates', templatesRouter);

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
	console.error(err);
	res.status(err?.status || 500).json({ error: err?.message || 'Internal Server Error' });
});

const PORT = config.port;
const MONGO_URI = config.mongoUri;

async function start() {
	try {
		await mongoose.connect(MONGO_URI);
		console.log('Connected to MongoDB');
		app.listen(PORT, () => console.log(`Service listening on :${PORT}`));
	} catch (e) {
		console.error('Failed to start service', e);
		process.exit(1);
	}
}

start();