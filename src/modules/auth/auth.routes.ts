import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateDto } from '../../common/middleware';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto
} from './auth.dto';

export const buildAuthRouter = (controller: AuthController): Router => {
  const router = Router();

  router.post('/register', validateDto(RegisterDto), controller.register);
  router.post('/signup', validateDto(RegisterDto), controller.register);
  router.post('/login', validateDto(LoginDto), controller.login);
  router.post('/refresh', controller.refresh);
  router.post('/logout', controller.logout);
  router.post('/forgot-password', validateDto(ForgotPasswordDto), controller.forgotPassword);
  router.post('/reset-password', validateDto(ResetPasswordDto), controller.resetPassword);

  return router;
};
