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
  error: string | null; // ✅ ADDED: State for API errors
  checkAuth: () => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  register: (/*...args*/) => Promise<void>; 
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void; // ✅ ADDED: Function to clear the error
}

// Check if our Dev Mode flag is set
const IS_DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, 
  error: null, // ✅ ADDED: Initial error state

  // --- THE CORE AUTH FUNCTION ---
  checkAuth: async () => {
    set({ isLoading: true });
    
    if (IS_DEV_MODE) {
      console.warn("--- DEV MODE ACTIVE: Bypassing login ---");
      set({ user: MOCK_USER as User, isAuthenticated: true, isLoading: false, error: null });
      return;
    }
    
    try {
      const token = await storage.get('accessToken');
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false, error: null });
        return;
      }
      
      const response = await api.get('/users/me'); 
      set({ user: response.data, isAuthenticated: true, isLoading: false, error: null });

    } catch (error) {
      await storage.remove('accessToken');
      await storage.remove('refreshToken');
      await storage.remove('user');
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },
  // --- LOG IN FUNCTION ---
  login: async (email, password) => {
    console.log('🔐 Attempting login...');
    
    // Reset error before attempting login
    set({ error: null });

    try {
        const response = await api.post('/auth/login', { email, password });
        const { access_token, refresh_token, user } = response.data;
        
        console.log('✅ Login response received:', {
            hasAccessToken: !!access_token,
            hasRefreshToken: !!refresh_token,
            hasUser: !!user,
            userEmail: user?.email
        });
        
        await storage.set('accessToken', access_token);
        await storage.set('refreshToken', refresh_token);
        await storage.set('user', user);
        
        const storedToken = await storage.get('accessToken');
        console.log('💾 Token stored and retrieved:', {
            stored: !!storedToken,
            matches: storedToken === access_token,
            tokenPreview: storedToken?.substring(0, 20) + '...'
        });
        
        set({ user, isAuthenticated: true, error: null });
        console.log('🎉 Auth store updated');
    } catch (err) {
        // Assuming your API interceptor handles the error conversion (like 401/403)
        // You need an error utility here to extract the message, but for now we'll set a generic one.
        // If your API utility handles error message extraction, call it here.
        set({ error: 'Login failed. Please check your credentials.' });
        throw err; // Re-throw so the LoginForm can handle the loading state change
    }
  },

  // --- LOG OUT FUNCTION ---
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Logout failed, but clearing client-side anyway", error);
    }
    
    await storage.remove('accessToken');
    await storage.remove('refreshToken');
    await storage.remove('user');
    
    set({ user: null, isAuthenticated: false, error: null });
  },

  // Register function (you can build this out)
  register: async (/*...args*/) => {
    // ... call api.post('/auth/register', ...)
    // ... then call get().login(...)
    throw new Error("Register function not implemented.");
  },

  // Function to allow components (like Settings) to update the user
  setUser: (user: User) => {
    set({ user });
  },

  // ✅ ADDED: The missing function that caused the error
  clearError: () => {
    set({ error: null });
  }
}));