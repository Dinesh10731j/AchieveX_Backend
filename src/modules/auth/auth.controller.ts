import { Request, Response } from 'express';
import { UnauthorizedError } from '../../common/errors';
import { clearAuthCookies, getRefreshTokenFromRequest, setAuthCookies } from '../../common/utils/cookie';
import { Message } from '../../constant/message.constant';
import { HTTP_STATUS } from '../../constant/statusCode.constant';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './auth.dto';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public register = async (req: Request<unknown, unknown, RegisterDto>, res: Response): Promise<void> => {
    const result = await this.authService.register(req.body);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(HTTP_STATUS.CREATED).json({ message: Message.REGISTER_SUCCESS });
  };

  public login = async (req: Request<unknown, unknown, LoginDto>, res: Response): Promise<void> => {
    const result = await this.authService.login(req.body.identity, req.body.password);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(HTTP_STATUS.OK).json({ message: Message.LOGIN_SUCCESS });
  };

  public refresh = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (!refreshToken) {
      throw new UnauthorizedError(Message.INVALID_OR_EXPIRED_TOKEN);
    }

    const result = await this.authService.refresh(refreshToken);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(HTTP_STATUS.OK).json({ message: Message.REFRESH_SUCCESS });
  };

  public logout = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    clearAuthCookies(res);
    res.status(HTTP_STATUS.OK).json({ message: Message.LOGOUT_SUCCESS });
  };

  public forgotPassword = async (
    req: Request<unknown, unknown, ForgotPasswordDto>,
    res: Response
  ): Promise<void> => {
    await this.authService.forgotPassword(req.body.email);
    res.status(HTTP_STATUS.OK).json({ message: Message.RESET_EMAIL_SENT });
  };

  public resetPassword = async (
    req: Request<unknown, unknown, ResetPasswordDto>,
    res: Response
  ): Promise<void> => {
    await this.authService.resetPassword(req.body.token, req.body.newPassword);
    res.status(HTTP_STATUS.OK).json({ message: Message.PASSWORD_RESET_SUCCESS });
  };
}
