import type { User } from '@prisma/client';
import userRepository from '../repositories/user.repository';
import { PasswordUtil } from '../utils/password.util';
import { JwtUtil, JwtPayload } from '../utils/jwt.util';
import { RegisterDto, LoginDto } from '../types';
import { AppError } from '../middleware/error.middleware';

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterDto): Promise<{ user: Omit<User, 'password'>; tokens: { accessToken: string; refreshToken: string } }> {
    // Check if email already exists
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError(409, 'Email already registered');
    }

    // Validate password strength
    const passwordValidation = PasswordUtil.validateStrength(data.password);
    if (!passwordValidation.valid) {
      throw new AppError(400, passwordValidation.errors.join(', '));
    }

    // Hash password
    const hashedPassword = await PasswordUtil.hash(data.password);

    // Create user
    const user = await userRepository.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    // Generate tokens
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = JwtUtil.generateAccessToken(payload);
    const refreshToken = JwtUtil.generateRefreshToken(payload);

    // Remove password from response
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
    // Find user by email
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError(403, 'Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await PasswordUtil.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Generate tokens
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = JwtUtil.generateAccessToken(payload);
    const refreshToken = JwtUtil.generateRefreshToken(payload);

    // Remove password from response
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
      // Verify refresh token
      const payload = JwtUtil.verifyRefreshToken(refreshToken);

      // Find user to ensure they still exist and are active
      const user = await userRepository.findById(payload.userId);
      if (!user || !user.isActive) {
        throw new AppError(401, 'Invalid refresh token');
      }

      // Generate new tokens
      const newPayload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const newAccessToken = JwtUtil.generateAccessToken(newPayload);
      const newRefreshToken = JwtUtil.generateRefreshToken(newPayload);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
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
}

export default new AuthService();
