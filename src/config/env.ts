import dotenv from 'dotenv';

dotenv.config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const asNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const asBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (!value) {
    return fallback;
  }

  const normalized = value.toLowerCase().trim();
  if (['true', '1', 'yes', 'y'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'n'].includes(normalized)) {
    return false;
  }

  return fallback;
};

const smtpUser = process.env.SMTP_USER ?? '';

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: asNumber(process.env.PORT, 4000),
  apiPrefix: process.env.API_PREFIX ?? '/api/v1',
  databaseUrl: required('DATABASE_URL'),
  autoRunMigrations: asBoolean(process.env.AUTO_RUN_MIGRATIONS, true),

  redisEnabled: asBoolean(process.env.REDIS_ENABLED, true),
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  redisConnectTimeoutMs: asNumber(process.env.REDIS_CONNECT_TIMEOUT_MS, 2000),

  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',

  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL ?? 'info',

  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
  maxUploadSizeMb: asNumber(process.env.MAX_UPLOAD_SIZE_MB, 25),

  smtpHost: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  smtpPort: asNumber(process.env.SMTP_PORT, 587),
  smtpSecure: asBoolean(process.env.SMTP_SECURE, false),
  smtpUser,
  smtpPass: process.env.SMTP_PASS ?? '',
  smtpFrom: process.env.SMTP_FROM ?? (smtpUser ? `AchieveX <${smtpUser}>` : 'AchieveX <no-reply@achievex.local>'),

  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER ?? 'achievex/proofs'
} as const;

export const isProduction = env.nodeEnv === 'production';
