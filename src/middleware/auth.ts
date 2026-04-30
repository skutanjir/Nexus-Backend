import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import redis from '../config/redis';

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  try {
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      res.status(401).json({ error: 'Unauthorized: Token is blacklisted' });
      return;
    }

    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

export function requireSeller(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'seller') {
    res.status(403).json({ error: 'Forbidden: Seller access required' });
    return;
  }
  next();
}
