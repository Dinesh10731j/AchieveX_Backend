import nodemailer from 'nodemailer';
import { env } from './env';
import { logger } from '../common/utils/logger';

export const isSmtpConfigured = (): boolean => {
  return Boolean(env.smtpUser && env.smtpPass);
};

export const verifySmtpConnection = async (): Promise<boolean> => {
  if (!isSmtpConfigured()) {
    logger.warn('SMTP not configured. Email delivery is disabled.');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass
      }
    });

    await transporter.verify();
    logger.info('SMTP connection verified');
    return true;
  } catch (error) {
    logger.error('SMTP verification failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
};
