import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from './constants';
import { storage } from './storage';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    const accessToken = await storage.get<string>('accessToken');
    console.log('📤 API Request:', {
      url: config.url,
      method: config.method,
      hasToken: !!accessToken,
      tokenPreview: accessToken?.substring(0, 20) + '...' || 'NO TOKEN'
    });
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await storage.get<string>('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data;

        await storage.set('accessToken', access_token);
        await storage.set('refreshToken', refresh_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear auth data
        await storage.remove('accessToken');
        await storage.remove('refreshToken');
        await storage.remove('user');
        
        // Notify user to login again
        chrome.runtime.sendMessage({ type: 'AUTH_EXPIRED' });
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API error handler
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      return error.response.data?.detail || error.response.data?.message || 'An error occurred';
    } else if (error.request) {
      return 'No response from server. Please check your connection.';
    }
  }
  return 'An unexpected error occurred';
}