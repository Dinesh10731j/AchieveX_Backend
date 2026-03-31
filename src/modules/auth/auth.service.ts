import { createHash, randomBytes } from 'crypto';
import { UserRole } from '../../database/entities';
import {
  NotificationPreferenceRepository,
  RefreshTokenRepository,
  UserRepository
} from '../../database/repositories';
import { AppError, UnauthorizedError } from '../../common/errors';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../common/utils/jwt';
import { hashPassword, verifyPassword } from '../../common/utils/password';
import { env } from '../../config/env';
import { toMs } from '../../common/utils/time';
import { EmailService } from '../../common/utils/email.service';
import { RegisterDto } from './auth.dto';

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly notificationPreferenceRepository: NotificationPreferenceRepository,
    private readonly emailService: EmailService
  ) {}

  public async register(dto: RegisterDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string; username: string; role: UserRole };
  }> {
    const existingByEmail = await this.userRepository.findByEmail(dto.email);
    if (existingByEmail) {
      throw new AppError('Email is already in use', 409);
    }

    const existingByUsername = await this.userRepository.findByUsername(dto.username);
    if (existingByUsername) {
      throw new AppError('Username is already in use', 409);
    }

    const passwordHash = await hashPassword(dto.password);
    const user = await this.userRepository.createUser({
      email: dto.email,
      username: dto.username,
      passwordHash
    });

    await this.notificationPreferenceRepository.ensureDefault(user.id);

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id, user.role);

    await this.refreshTokenRepository.createToken({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + toMs(env.jwtRefreshExpiresIn))
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    };
  }

  public async login(identity: string, password: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string; username: string; role: UserRole };
  }> {
    const user = identity.includes('@')
      ? await this.userRepository.findByEmail(identity)
      : await this.userRepository.findByUsername(identity);

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is disabled');
    }

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id, user.role);

    await this.refreshTokenRepository.createToken({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + toMs(env.jwtRefreshExpiresIn))
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    };
  }

  public async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = verifyRefreshToken(refreshToken);
    if (payload.type !== 'refresh') {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const tokenRecord = await this.refreshTokenRepository.findByToken(refreshToken);
    if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedError('Refresh token is expired or revoked');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    await this.refreshTokenRepository.revokeToken(tokenRecord.id);

    const newAccessToken = signAccessToken(user.id, user.role);
    const newRefreshToken = signRefreshToken(user.id, user.role);

    await this.refreshTokenRepository.createToken({
      userId: user.id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + toMs(env.jwtRefreshExpiresIn))
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  public async logout(refreshToken: string): Promise<void> {
    const tokenRecord = await this.refreshTokenRepository.findByToken(refreshToken);
    if (!tokenRecord) {
      return;
    }

    await this.refreshTokenRepository.revokeToken(tokenRecord.id);
  }

  public async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return;
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.userRepository.setPasswordResetToken(user.id, tokenHash, expiresAt);

    const resetLink = `${env.frontendUrl}/reset-password?token=${rawToken}`;
    await this.emailService.sendForgotPasswordEmail({
      to: user.email,
      username: user.username,
      resetLink
    });
  }

  public async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const user = await this.userRepository.findByResetTokenHash(tokenHash);

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const passwordHash = await hashPassword(newPassword);
    await this.userRepository.updatePassword(user.id, passwordHash);
    await this.refreshTokenRepository.revokeAllForUser(user.id);

    await this.emailService.sendPasswordChangedEmail({
      to: user.email,
      username: user.username
    });
  }
}
