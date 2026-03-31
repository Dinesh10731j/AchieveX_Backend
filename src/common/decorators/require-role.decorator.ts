import { NextFunction, Request, Response } from 'express';
import { UserRole } from '../../database/entities';
import { ForbiddenError, UnauthorizedError } from '../errors';

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      throw new UnauthorizedError();
    }

    if (!roles.includes(req.auth.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
};
