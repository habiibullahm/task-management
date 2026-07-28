import { create } from 'zustand';
import { authService } from '@/services/auth.service';
import { handleApiError } from '@/services/api';
import { disconnectRealtime } from '@/services/realtime';
import type { User, LoginCredentials, RegisterData } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false,
  error: null,

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(credentials);
      set({ 
        user: response.user, 
        isAuthenticated: true, 
        isLoading: false,
        error: null 
      });
    } catch (error) {
      const errorMessage = handleApiError(error, 'Login failed');
      set({ 
        error: errorMessage, 
        isLoading: false,
        isAuthenticated: false,
        user: null 
      });
      throw new Error(errorMessage);
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(data);
      set({ 
        user: response.user, 
        isAuthenticated: true, 
        isLoading: false,
        error: null 
      });
    } catch (error) {
      const errorMessage = handleApiError(error, 'Registration failed');
      set({ 
        error: errorMessage, 
        isLoading: false,
        isAuthenticated: false,
        user: null 
      });
      throw new Error(errorMessage);
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
      disconnectRealtime();
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: null 
      });
    } catch (error) {
      // Even if logout fails on server, clear local state
      disconnectRealtime();
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: null 
      });
    }
  },

  fetchProfile: async () => {
    if (!authService.isAuthenticated()) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const user = await authService.getProfile();
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        error: null 
      });
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to fetch profile');
      set({ 
        error: errorMessage, 
        isLoading: false,
        isAuthenticated: false,
        user: null 
      });
      // Clear tokens if profile fetch fails
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  clearError: () => set({ error: null }),
  
  setUser: (user: User | null) => set({ user, isAuthenticated: !!user }),
}));

