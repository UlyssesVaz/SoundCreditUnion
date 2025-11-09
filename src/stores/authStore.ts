import { create } from 'zustand';
import { api, handleApiError } from '../utils/api';
import { storage } from '../utils/storage';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, refresh_token, user } = response.data;

      // Store in chrome.storage
      await storage.set('accessToken', access_token);
      await storage.set('refreshToken', refresh_token);
      await storage.set('user', user);

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      // Notify background script
      chrome.runtime.sendMessage({ type: 'USER_LOGGED_IN', user });
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true, error: null });
    
    try {
      await api.post('/auth/register', data);
      
      // Auto-login after registration
      await get().login(data.email, data.password);
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  logout: async () => {
    set({ isLoading: true });
    
    try {
      // Call logout endpoint (optional)
      await api.post('/auth/logout').catch(() => {});
      
      // Clear storage
      await storage.remove('accessToken');
      await storage.remove('refreshToken');
      await storage.remove('user');

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      // Notify background script
      chrome.runtime.sendMessage({ type: 'USER_LOGGED_OUT' });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    
    try {
      const [accessToken, user] = await Promise.all([
        storage.get<string>('accessToken'),
        storage.get<User>('user'),
      ]);

      if (accessToken && user) {
        // Verify token is still valid by fetching user profile
        try {
          const response = await api.get('/auth/me');
          set({
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Token invalid, clear auth
          await get().logout();
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  updateUser: async (updates: Partial<User>) => {
    const currentUser = get().user;
    if (!currentUser) return;

    set({ isLoading: true, error: null });

    try {
      const response = await api.put('/users/me', updates);
      const updatedUser = response.data;

      await storage.set('user', updatedUser);
      set({ user: updatedUser, isLoading: false });
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
}));