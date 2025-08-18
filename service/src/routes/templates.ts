import { Router, Request, Response } from 'express';
import { Template } from '../models/Assessment';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response) => {
	const userId = (req as any).auth.userId;
	const list = await Template.find({ userId }).sort({ createdAt: -1 }).lean();
	res.json({ templates: list });
});

router.post('/', requireAuth, async (req: Request, res: Response) => {
	const userId = (req as any).auth.userId;
	const template = await Template.create({ userId, ...req.body });
	res.json({ template });
});

router.put('/:id', requireAuth, async (req: Request, res: Response) => {
	const userId = (req as any).auth.userId;
	const t = await Template.findOneAndUpdate({ _id: req.params.id, userId }, req.body, { new: true });
	if (!t) return res.status(404).json({ error: 'Not found' });
	res.json({ template: t });
});

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
	const userId = (req as any).auth.userId;
	const t = await Template.findOneAndDelete({ _id: req.params.id, userId });
	if (!t) return res.status(404).json({ error: 'Not found' });
	res.json({ ok: true });
});

export default router; 