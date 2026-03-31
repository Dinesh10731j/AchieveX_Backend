import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto
} from './auth.dto';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public register = async (req: Request<unknown, unknown, RegisterDto>, res: Response): Promise<void> => {
    const result = await this.authService.register(req.body);
    res.status(201).json(result);
  };

  public login = async (req: Request<unknown, unknown, LoginDto>, res: Response): Promise<void> => {
    const result = await this.authService.login(req.body.identity, req.body.password);
    res.status(200).json(result);
  };

  public refresh = async (
    req: Request<unknown, unknown, RefreshTokenDto>,
    res: Response
  ): Promise<void> => {
    const result = await this.authService.refresh(req.body.refreshToken);
    res.status(200).json(result);
  };

  public logout = async (
    req: Request<unknown, unknown, RefreshTokenDto>,
    res: Response
  ): Promise<void> => {
    await this.authService.logout(req.body.refreshToken);
    res.status(204).send();
  };

  public forgotPassword = async (
    req: Request<unknown, unknown, ForgotPasswordDto>,
    res: Response
  ): Promise<void> => {
    await this.authService.forgotPassword(req.body.email);
    res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });
  };

  public resetPassword = async (
    req: Request<unknown, unknown, ResetPasswordDto>,
    res: Response
  ): Promise<void> => {
    await this.authService.resetPassword(req.body.token, req.body.newPassword);
    res.status(200).json({ message: 'Password has been reset successfully.' });
  };
}
