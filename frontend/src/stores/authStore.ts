// src/stores/authStore.ts
import create from 'zustand';
import { api } from '../utils/api';
import { storage } from '../utils/storage';

// --- MOCK DATA FOR DEV MODE ---
const MOCK_USER = {
  id: '123',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  segment: 'growth',
  financial_profile: {
    annual_income: 65000,
    credit_score: 720,
    dti_ratio: 0.28
  },
  created_at: new Date().toISOString(),
  is_verified: true,
  is_active: true,
  phone: null,
  preferences: {}
};
// --- END MOCK DATA ---

// Define the shape of your User object (based on MOCK_USER and API)
interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  segment: string;
  financial_profile: {
    annual_income: number;
    credit_score: number;
    dti_ratio: number;
  };
  created_at: string;
  is_verified: boolean;
  is_active: boolean;
  phone: string | null;
  preferences: object;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  register: (/*...args*/) => Promise<void>; // Add register params
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

// Check if our Dev Mode flag is set
const IS_DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start in loading state

  // --- THE CORE AUTH FUNCTION ---
  checkAuth: async () => {
    set({ isLoading: true });
    
    // 1. DEV MODE BYPASS
    if (IS_DEV_MODE) {
      console.warn("--- DEV MODE ACTIVE: Bypassing login ---");
      set({ user: MOCK_USER as User, isAuthenticated: true, isLoading: false });
      return;
    }
    
    // 2. PRODUCTION AUTH CHECK
    try {
      const token = await storage.get('accessToken');
      if (!token) {
        throw new Error("No token");
      }
      
      // We have a token, let's verify it by fetching the user
      // The api client interceptor will handle refresh if needed
      const response = await api.get('/users/me'); 
      set({ user: response.data, isAuthenticated: true, isLoading: false });

    } catch (error) {
      // No valid token, clear everything
      await storage.remove('accessToken');
      await storage.remove('refreshToken');
      await storage.remove('user');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  // --- LOG IN FUNCTION ---
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { access_token, refresh_token, user } = response.data;
    
    await storage.set('accessToken', access_token);
    await storage.set('refreshToken', refresh_token);
    await storage.set('user', user); // Also store user for quick load
    
    set({ user, isAuthenticated: true });
  },

  // --- LOG OUT FUNCTION ---
  logout: async () => {
    try {
      // Tell the server to revoke the tokens
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Logout failed, but clearing client-side anyway", error);
    }
    
    // Clear all local data
    await storage.remove('accessToken');
    await storage.remove('refreshToken');
    await storage.remove('user');
    
    // Reset the store
    set({ user: null, isAuthenticated: false });
  },

  // Register function (you can build this out)
  register: async (/*...args*/) => {
    // ... call api.post('/auth/register', ...)
    // ... then call get().login(...)
  },

  // Function to allow components (like Settings) to update the user
  setUser: (user: User) => {
    set({ user });
  }
}));