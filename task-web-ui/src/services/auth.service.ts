import apiClient from './api';
import type { ApiResponse, LoginCredentials, RegisterData, AuthResponse, User } from '@/types';

export const authService = {
  // Register a new user
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    if (response.data.success && response.data.data) {
      const { tokens } = response.data.data;
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      return response.data.data;
    }
    throw new Error(response.data.message || 'Registration failed');
  },

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    if (response.data.success && response.data.data) {
      const { tokens } = response.data.data;
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      return response.data.data;
    }
    throw new Error(response.data.message || 'Login failed');
  },

  // Get current user profile
  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/profile');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch profile');
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      '/auth/refresh',
      { refreshToken }
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Token refresh failed');
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await apiClient.post<ApiResponse>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Unable to change password');
    }
  },

  async forgotPassword(email: string): Promise<{
    message: string;
    resetToken?: string;
    emailSent?: boolean;
    devResetUrl?: string;
    emailError?: string;
  }> {
    // #region agent log
    const __dbgStarted = Date.now();
    const FORGOT_PASSWORD_TIMEOUT_MS = 25_000;
    fetch('http://127.0.0.1:7355/ingest/ccefaceb-6e3b-4191-bb20-389c82942a55', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd7a94c' },
      body: JSON.stringify({
        sessionId: 'd7a94c',
        runId: 'post-fix',
        hypothesisId: 'A',
        location: 'auth.service.ts:forgotPassword',
        message: 'authService.forgotPassword request',
        data: { timeoutMs: FORGOT_PASSWORD_TIMEOUT_MS },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    try {
      const response = await apiClient.post<
        ApiResponse<{
          resetToken?: string;
          emailSent?: boolean;
          devResetUrl?: string;
          emailError?: string;
        }>
      >(
        '/auth/forgot-password',
        {
          email,
        },
        { timeout: FORGOT_PASSWORD_TIMEOUT_MS }
      );
      // #region agent log
      fetch('http://127.0.0.1:7355/ingest/ccefaceb-6e3b-4191-bb20-389c82942a55', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd7a94c' },
        body: JSON.stringify({
          sessionId: 'd7a94c',
          runId: 'post-fix',
          hypothesisId: 'A',
          location: 'auth.service.ts:forgotPassword:response',
          message: 'authService.forgotPassword got response',
          data: {
            elapsedMs: Date.now() - __dbgStarted,
            httpStatus: response.status,
            success: response.data.success,
            emailSent: response.data.data?.emailSent,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      if (response.data.success) {
        return {
          message: response.data.message,
          resetToken: response.data.data?.resetToken,
          emailSent: response.data.data?.emailSent,
          devResetUrl: response.data.data?.devResetUrl,
          emailError: response.data.data?.emailError,
        };
      }
      throw new Error(response.data.message || 'Unable to process password reset');
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7355/ingest/ccefaceb-6e3b-4191-bb20-389c82942a55', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd7a94c' },
        body: JSON.stringify({
          sessionId: 'd7a94c',
          runId: 'post-fix',
          hypothesisId: 'A',
          location: 'auth.service.ts:forgotPassword:catch',
          message: 'authService.forgotPassword error',
          data: {
            elapsedMs: Date.now() - __dbgStarted,
            errorMessage: error instanceof Error ? error.message : String(error),
            looksLikeAxiosTimeout:
              error instanceof Error && /timeout of \d+ms exceeded/i.test(error.message),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      throw error;
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await apiClient.post<ApiResponse>('/auth/reset-password', {
      token,
      newPassword,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Unable to reset password');
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },

  // Get stored access token
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  // Get stored refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  },
};

