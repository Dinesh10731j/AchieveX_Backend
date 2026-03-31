import { NextFunction, Request, Response } from 'express';
import { UserRole } from '../../database/entities';
import { getAccessTokenFromRequest } from '../utils/cookie';
import { verifyAccessToken } from '../utils/jwt';

export const optionalAuthMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const token = getAccessTokenFromRequest(req);

  if (!token) {
    next();
    return;
  }

  try {
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
