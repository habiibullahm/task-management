import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorResponse, ApiResponse, ValidationErrorItem } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Extract a user-facing message from an API/Axios/unknown error.
 * Prefers API `message`, then first validation `errors` entry.
 */
export const handleApiError = (
  error: unknown,
  fallback = 'An unexpected error occurred'
): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.message) {
      return formatMessageWithErrors(data.message, data.errors);
    }
    if (data?.errors?.length) {
      return formatValidationErrors(data.errors);
    }
    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

function formatValidationErrors(errors: ValidationErrorItem[]): string {
  const first = errors[0];
  if (!first) return 'Validation failed';
  return first.field ? `${first.field}: ${first.message}` : first.message;
}

function formatMessageWithErrors(message: string, errors?: ValidationErrorItem[]): string {
  if (!errors?.length) return message;
  // Prefer the first field-level message when the top-level message is generic
  if (message === 'Validation failed') {
    return formatValidationErrors(errors);
  }
  return message;
}

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(new Error(handleApiError(error)))
);

// Response interceptor - Map API errors to Error(message) for stores/forms
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const requestUrl = originalRequest?.url ?? '';
    // Login/register/refresh 401s are credential failures — do not attempt token refresh or hard-redirect
    const isCredentialAuthRequest = /\/auth\/(login|register|refresh)(?:\?|$)/.test(requestUrl);

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isCredentialAuthRequest
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        if (response.data.success && response.data.data) {
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(new Error(handleApiError(refreshError, 'Session expired')));
      }
    }

    // Single clear Error so stores/forms can use error.message without Axios noise
    return Promise.reject(new Error(handleApiError(error)));
  }
);

export default apiClient;
