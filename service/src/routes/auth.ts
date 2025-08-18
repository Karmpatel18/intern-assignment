import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { createJwtToken, requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
	const { name, email, password } = req.body || {};
	if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
	const existing = await User.findOne({ email });
	if (existing) return res.status(409).json({ error: 'Email already in use' });
	const passwordHash = await bcrypt.hash(password, 10);
	const user = await User.create({ name, email, passwordHash });
	const token = createJwtToken({ userId: user.id, email: user.email });
	return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

router.post('/login', async (req: Request, res: Response) => {
	const { email, password } = req.body || {};
	if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
	const user = await User.findOne({ email });
	if (!user) return res.status(401).json({ error: 'Invalid credentials' });
	const ok = await user.comparePassword(password);
	if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
	const token = createJwtToken({ userId: user.id, email: user.email });
	return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

router.get('/me', requireAuth, async (req: Request, res: Response) => {
	const auth = (req as any).auth as { userId: string };
	const user = await User.findById(auth.userId).lean();
	if (!user) return res.status(404).json({ error: 'User not found' });
	return res.json({ user: { id: user._id, name: user.name, email: user.email } });
});

export default router; 