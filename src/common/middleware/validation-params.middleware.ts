import { NextFunction, Request, Response } from 'express';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ValidationError as AppValidationError } from '../errors';

export const validateParamsDto = <T extends object>(dtoClass: ClassConstructor<T>) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const payload = plainToInstance(dtoClass, req.params, {
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
      throw new AppValidationError('Params validation failed', details);
    }

    req.params = payload as Request['params'];
    next();
  };
};
