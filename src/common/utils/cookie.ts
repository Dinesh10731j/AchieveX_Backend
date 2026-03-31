import { CookieOptions, Request, Response } from 'express';
import { isProduction } from '../../config/env';

export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

const parseCookies = (cookieHeader?: string): Record<string, string> => {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, current) => {
      const separator = current.indexOf('=');
      if (separator <= 0) {
        return acc;
      }

      const key = decodeURIComponent(current.slice(0, separator).trim());
      const value = decodeURIComponent(current.slice(separator + 1).trim());
      acc[key] = value;
      return acc;
    }, {});
};

export const getCookieValue = (req: Request, cookieName: string): string | undefined => {
  const cookies = parseCookies(req.headers.cookie);
  return cookies[cookieName];
};

export const getAccessTokenFromRequest = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return getCookieValue(req, ACCESS_TOKEN_COOKIE);
};

export const getRefreshTokenFromRequest = (req: Request): string | undefined => {
  const cookieToken = getCookieValue(req, REFRESH_TOKEN_COOKIE);
  if (cookieToken) {
    return cookieToken;
  }

  const refreshToken = (req.body as { refreshToken?: unknown } | undefined)?.refreshToken;
  return typeof refreshToken === 'string' ? refreshToken : undefined;
};

const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/'
};

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string): void => {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, authCookieOptions);
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, authCookieOptions);
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, authCookieOptions);
  res.clearCookie(REFRESH_TOKEN_COOKIE, authCookieOptions);
};
