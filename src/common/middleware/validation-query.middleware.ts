import { NextFunction, Request, Response } from 'express';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ValidationError as AppValidationError } from '../errors';

export const validateQueryDto = <T extends object>(dtoClass: ClassConstructor<T>) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const payload = plainToInstance(dtoClass, req.query, {
      enableImplicitConversion: true
    });

    const errors = await validate(payload, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: false
    });

    if (errors.length > 0) {
      const details = errors.map((error) => ({
        property: error.property,
        constraints: error.constraints
      }));
      throw new AppValidationError('Query validation failed', details);
    }

    req.query = payload as Request['query'];
    next();
  };
};
