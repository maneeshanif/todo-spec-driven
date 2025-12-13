import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
// TODO: Implement proper token refresh when backend supports it
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Only handle 401 Unauthorized errors
    // Other errors (404, 500, etc.) should just be rejected normally
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Log the 401 error for debugging
    console.warn('401 Unauthorized - token expired or invalid');

    // Clear all auth data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('refresh-token');
      localStorage.removeItem('auth-storage');

      // Update zustand store
      const { useAuthStore } = await import('@/stores/auth-store');
      useAuthStore.getState().logout();

      // Redirect to login
      window.location.href = '/login?expired=true';
    }

    return Promise.reject(error);
  }
);

export default apiClient;