import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/tests'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/tests/**', '!src/database/migrations/**'],
  setupFiles: ['<rootDir>/src/tests/setup-env.ts', 'dotenv/config'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup-after-env.ts']
};

export default config;
