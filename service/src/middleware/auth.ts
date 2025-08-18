import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthPayload {
	userId: string;
	email: string;
}

export function createJwtToken(payload: AuthPayload): string {
	return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
	const header = req.headers.authorization;
	if (!header || !header.startsWith('Bearer ')) {
		return res.status(401).json({ error: 'Unauthorized' });
	}
	const token = header.slice('Bearer '.length);
	try {
		const decoded = jwt.verify(token, config.jwtSecret) as AuthPayload;
		(req as any).auth = decoded;
		return next();
	} catch {
		return res.status(401).json({ error: 'Invalid token' });
	}
} 