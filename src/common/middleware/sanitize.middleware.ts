import { NextFunction, Request, Response } from 'express';

const sanitizeString = (value: string): string => {
  return value.replace(/[<>]/g, '').trim();
};

const sanitizeObject = (payload: unknown): unknown => {
  if (Array.isArray(payload)) {
    return payload.map(sanitizeObject);
  }

  if (payload !== null && typeof payload === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      const safeKey = key.replace(/\$/g, '').replace(/\./g, '');
      result[safeKey] = sanitizeObject(value);
    }
    return result;
  }

  if (typeof payload === 'string') {
    return sanitizeString(payload);
  }

  return payload;
};

export const sanitizeInputMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query) as Request['query'];
  req.params = sanitizeObject(req.params) as Request['params'];
  next();
};
