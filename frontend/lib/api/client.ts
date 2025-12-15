import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Decode a JWT token to see its payload (for debugging)
 */
function decodeJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Bearer token from localStorage
apiClient.interceptors.request.use(
  async (config) => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('bearer_token');
      console.log('[API] Request to:', config.url, '| Token exists:', !!token, '| Token length:', token?.length || 0);
      if (token) {
        // Decode and log which user ID is in the token being sent
        const payload = decodeJwtPayload(token);
        console.log('[API] Token user ID (sub):', payload?.sub, '| email:', payload?.email);
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('[API] No bearer_token in localStorage!');
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Only handle 401 Unauthorized errors
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Log the 401 error for debugging
    console.warn('401 Unauthorized - backend API rejected request');

    // Don't sign out - the backend returning 401 doesn't mean Better Auth session is invalid
    // The backend may have its own auth system or the token format may differ
    // Just reject the error and let the calling code handle it
    
    return Promise.reject(error);
  }
);

export default apiClient;