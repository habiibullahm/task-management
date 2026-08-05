import type { User } from '@prisma/client';
import crypto from 'crypto';
import userRepository from '../repositories/user.repository';
import passwordResetRepository from '../repositories/password-reset.repository';
import { PasswordUtil } from '../utils/password.util';
import { JwtUtil, JwtPayload } from '../utils/jwt.util';
import { MailerUtil } from '../utils/mailer.util';
import { RegisterDto, LoginDto } from '../types';
import { AppError } from '../middleware/error.middleware';
import env from '../config/env';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const GENERIC_FORGOT_MESSAGE =
  'If an account exists for that email, password reset instructions have been sent.';
const MAILER_UNAVAILABLE_MESSAGE =
  'Password reset email is unavailable. Please try again later.';

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterDto): Promise<{ user: Omit<User, 'password'>; tokens: { accessToken: string; refreshToken: string } }> {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError(409, 'Email already registered');
    }

    const passwordValidation = PasswordUtil.validateStrength(data.password);
    if (!passwordValidation.valid) {
      throw new AppError(400, passwordValidation.errors.join(', '));
    }

    const hashedPassword = await PasswordUtil.hash(data.password);

    const user = await userRepository.create({
      email: data.email.trim().toLowerCase(),
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = JwtUtil.generateAccessToken(payload);
    const refreshToken = JwtUtil.generateRefreshToken(payload);

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * Login user
   */
  async login(data: LoginDto): Promise<{ user: Omit<User, 'password'>; tokens: { accessToken: string; refreshToken: string } }> {
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (!user.isActive) {
      throw new AppError(403, 'Account is deactivated');
    }

    const isPasswordValid = await PasswordUtil.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = JwtUtil.generateAccessToken(payload);
    const refreshToken = JwtUtil.generateRefreshToken(payload);

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = JwtUtil.verifyRefreshToken(refreshToken);

      const user = await userRepository.findById(payload.userId);
      if (!user || !user.isActive) {
        throw new AppError(401, 'Invalid refresh token');
      }

      const newPayload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      return {
        accessToken: JwtUtil.generateAccessToken(newPayload),
        refreshToken: JwtUtil.generateRefreshToken(newPayload),
      };
    } catch (error) {
      throw new AppError(401, 'Invalid refresh token');
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string): Promise<Omit<User, 'password'> | null> {
    const user = await userRepository.findById(userId);
    if (!user) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Change password while authenticated
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const matches = await PasswordUtil.compare(currentPassword, user.password);
    if (!matches) {
      throw new AppError(400, 'Current password is incorrect');
    }

    const passwordValidation = PasswordUtil.validateStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new AppError(400, passwordValidation.errors.join(', '));
    }

    if (await PasswordUtil.compare(newPassword, user.password)) {
      throw new AppError(400, 'New password must be different from the current password');
    }

    const hashedPassword = await PasswordUtil.hash(newPassword);
    await userRepository.update(userId, { password: hashedPassword });
    await passwordResetRepository.invalidateForUser(userId);
  }

  /**
   * Request password reset — always returns the same success message when mail works
   * (no email oracle for unknown addresses).
   * Production: 503 if mailer is missing or send fails.
   * Development: returns devResetUrl when mail cannot be sent (local DX).
   * Test: returns resetToken without requiring a real mailer.
   */
  async forgotPassword(email: string): Promise<{
    message: string;
    resetToken?: string;
    emailSent: boolean;
    devResetUrl?: string;
    emailError?: string;
  }> {
    if (!MailerUtil.isConfigured() && env.isProduction()) {
      throw new AppError(503, MAILER_UNAVAILABLE_MESSAGE);
    }

    const normalized = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(normalized);

    if (!user || !user.isActive) {
      return { message: GENERIC_FORGOT_MESSAGE, emailSent: false };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashResetToken(rawToken);

    await passwordResetRepository.invalidateForUser(user.id);
    await passwordResetRepository.create({
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      user: { connect: { id: user.id } },
    });

    const resetUrl = MailerUtil.buildResetUrl(rawToken);

    // CI / e2e: no inbox — skip send when mailer is unset
    if (env.isTest() && !MailerUtil.isConfigured()) {
      return {
        message: GENERIC_FORGOT_MESSAGE,
        emailSent: false,
        resetToken: rawToken,
      };
    }

    const mail = await MailerUtil.sendPasswordResetEmail(user.email, resetUrl);
    if (!mail.sent) {
      console.error(`[auth] Password reset email failed: ${mail.error ?? 'unknown'}`);

      if (env.isDevelopment()) {
        console.info(`[auth] Password reset link (email not sent): ${resetUrl}`);
        return {
          message: GENERIC_FORGOT_MESSAGE,
          emailSent: false,
          devResetUrl: resetUrl,
          emailError: mail.error,
        };
      }

      // Production, or test with a configured mailer that failed
      throw new AppError(503, MAILER_UNAVAILABLE_MESSAGE);
    }

    const result: {
      message: string;
      resetToken?: string;
      emailSent: boolean;
      devResetUrl?: string;
      emailError?: string;
    } = {
      message: GENERIC_FORGOT_MESSAGE,
      emailSent: true,
    };

    if (env.isTest()) {
      result.resetToken = rawToken;
    }
    return result;
  }

  /**
   * Reset password with a one-time token
   */
  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    if (!rawToken?.trim()) {
      throw new AppError(400, 'Reset token is required');
    }

    const passwordValidation = PasswordUtil.validateStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new AppError(400, passwordValidation.errors.join(', '));
    }

    const tokenHash = this.hashResetToken(rawToken.trim());
    const record = await passwordResetRepository.findValidByTokenHash(tokenHash);
    if (!record) {
      throw new AppError(400, 'Invalid or expired reset token');
    }

    const hashedPassword = await PasswordUtil.hash(newPassword);
    await userRepository.update(record.userId, { password: hashedPassword });
    await passwordResetRepository.markUsed(record.id);
    await passwordResetRepository.invalidateForUser(record.userId);
  }

  private hashResetToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }
}

export default new AuthService();
