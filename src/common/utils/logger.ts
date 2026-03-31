import winston from 'winston';
import { env, isProduction } from '../../config/env';

const logFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level}] ${message}${metaString}`;
});

export const logger = winston.createLogger({
  level: env.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    isProduction ? winston.format.json() : logFormat
  ),
  transports: [new winston.transports.Console()]
});
