// Authentication API functions
import apiClient from './client';

export interface SignupData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    name: string;
    created_at: string;
    updated_at: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

/**
 * Register a new user
 */
export async function signup(data: SignupData): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>('/api/auth/signup', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Signup failed');
  }
}

/**
 * Login with email and password
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Login failed');
  }
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/api/auth/logout');
  } catch (error: any) {
    // Even if logout fails on server, we still clear client state
    console.error('Logout error:', error);
  }
}

/**
 * Get current authenticated user
 */
export async function getMe(): Promise<User> {
  try {
    const response = await apiClient.get<User>('/api/auth/me');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to get user info');
  }
}
