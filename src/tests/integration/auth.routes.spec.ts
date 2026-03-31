import 'express-async-errors';
import express from 'express';
import request from 'supertest';
import { buildAuthRouter } from '../../modules/auth/auth.routes';
import { AuthController } from '../../modules/auth/auth.controller';
import { AuthService } from '../../modules/auth/auth.service';
import { errorHandler } from '../../common/middleware';

const buildTestApp = (): express.Express => {
  const mockService = {
    register: jest.fn().mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { id: '1', email: 'a@b.com', username: 'alice', role: 'user' }
    }),
    login: jest.fn().mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { id: '1', email: 'a@b.com', username: 'alice', role: 'user' }
    }),
    refresh: jest.fn().mockResolvedValue({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
    logout: jest.fn().mockResolvedValue(undefined)
  } as unknown as AuthService;

  const controller = new AuthController(mockService);

  const app = express();
  app.use(express.json());
  app.use('/auth', buildAuthRouter(controller));
  app.use(errorHandler);
  return app;
};

describe('Auth routes', () => {
  it('returns 400 for invalid registration payload', async () => {
    const app = buildTestApp();
    const response = await request(app).post('/auth/register').send({ email: 'invalid' });

    expect(response.status).toBe(400);
  });

  it('returns 201 for valid registration payload', async () => {
    const app = buildTestApp();
    const response = await request(app).post('/auth/register').send({
      email: 'john@example.com',
      username: 'john_doe',
      password: 'StrongPassword123'
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'Registration successful' });
    expect(response.headers['set-cookie']).toBeDefined();
  });
});
