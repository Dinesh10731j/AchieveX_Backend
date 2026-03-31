import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';

export interface TokenPayload {
  sub: string;
  role: string;
  type: 'access' | 'refresh';
}

const signToken = (payload: TokenPayload, secret: string, expiresIn: string): string => {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions['expiresIn'],
    issuer: 'achievex-api',
    audience: 'achievex-client'
  };

  return jwt.sign(payload, secret, options);
};

export const signAccessToken = (userId: string, role: string): string => {
  return signToken({ sub: userId, role, type: 'access' }, env.jwtAccessSecret, env.jwtAccessExpiresIn);
};

export const signRefreshToken = (userId: string, role: string): string => {
  return signToken({ sub: userId, role, type: 'refresh' }, env.jwtRefreshSecret, env.jwtRefreshExpiresIn);
};

const verify = (token: string, secret: string): TokenPayload => {
  const decoded = jwt.verify(token, secret, {
    issuer: 'achievex-api',
    audience: 'achievex-client'
  }) as JwtPayload;

  return {
    sub: String(decoded.sub),
    role: String(decoded.role),
    type: decoded.type as 'access' | 'refresh'
  };
};

export const verifyAccessToken = (token: string): TokenPayload => verify(token, env.jwtAccessSecret);

export const verifyRefreshToken = (token: string): TokenPayload => verify(token, env.jwtRefreshSecret);
