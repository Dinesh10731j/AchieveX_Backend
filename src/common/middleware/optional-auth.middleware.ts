import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UserRole } from '../../database/entities';

export const optionalAuthMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    req.auth = {
      userId: payload.sub,
      role: payload.role as UserRole
    };
  } catch (_error) {
    // Ignore token errors for optional auth middleware.
  }

  next();
};
