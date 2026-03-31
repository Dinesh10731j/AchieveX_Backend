import { NextFunction, Request, Response } from 'express';
import { Message } from '../../constant/message.constant';
import { UserRole } from '../../database/entities';
import { UnauthorizedError } from '../errors';
import { getAccessTokenFromRequest } from '../utils/cookie';
import { verifyAccessToken } from '../utils/jwt';

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const token = getAccessTokenFromRequest(req);
  if (!token) {
    throw new UnauthorizedError(Message.ACCESS_TOKEN_MISSING);
  }

  const payload = verifyAccessToken(token);

  if (payload.type !== 'access') {
    throw new UnauthorizedError(Message.INVALID_TOKEN_PAYLOAD);
  }

  req.auth = {
    userId: payload.sub,
    role: payload.role as UserRole
  };

  next();
};
