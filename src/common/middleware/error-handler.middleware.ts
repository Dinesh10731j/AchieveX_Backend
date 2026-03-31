import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message,
      details: error.details ?? null
    });
    return;
  }

  logger.error('Unhandled error', { message: error.message, stack: error.stack });
  res.status(500).json({
    message: 'Internal server error'
  });
};
