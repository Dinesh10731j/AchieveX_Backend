import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError } from '../errors';
import { UserRole } from '../../database/entities';

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing bearer token');
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);

  if (payload.type !== 'access') {
    throw new UnauthorizedError('Invalid token type');
  }

  req.auth = {
    userId: payload.sub,
    role: payload.role as UserRole
  };

  next();
};
