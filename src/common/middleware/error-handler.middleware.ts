import { NextFunction, Request, Response } from 'express';
import { HTTP_STATUS } from '../../constant/statusCode.constant';
import { Message } from '../../constant/message.constant';
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
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: Message.INTERNAL_SERVER_ERROR
  });
};
