/**
 * API Client
 * Frontend HTTP client for making requests to API routes
 * Provides typed interfaces for all API endpoints
 */

import type { User, CreateUserData, UpdateUserData } from '@/types';

/**
 * Base API client with common request handling
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Make a fetch request with error handling
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Request failed',
      }));
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  /**
   * GET request
   */
  protected async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  protected async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  protected async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  protected async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

/**
 * User API client
 * Handles all user-related API requests
 */
export class UserApiClient extends ApiClient {
  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User> {
    return this.get<User>(`/users/${id}`);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return this.get<User | null>(`/users/by-email/${encodeURIComponent(email)}`);
  }

  /**
   * Get all users
   */
  async getAllUsers(filters?: { role?: 'parent' | 'kid' }): Promise<User[]> {
    const params = new URLSearchParams();
    if (filters?.role) {
      params.append('role', filters.role);
    }
    const query = params.toString();
    return this.get<User[]>(`/users${query ? `?${query}` : ''}`);
  }

  /**
   * Get all kids
   */
  async getKids(): Promise<User[]> {
    return this.getAllUsers({ role: 'kid' });
  }

  /**
   * Get all parents
   */
  async getParents(): Promise<User[]> {
    return this.getAllUsers({ role: 'parent' });
  }

  /**
   * Create a new user
   */
  async createUser(data: CreateUserData): Promise<User> {
    return this.post<User>('/users', data);
  }

  /**
   * Update an existing user
   */
  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    return this.patch<User>(`/users/${id}`, data);
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<void> {
    return this.delete<void>(`/users/${id}`);
  }

  /**
   * Update user's screen time allowance
   */
  async updateScreenTime(id: string, minutes: number): Promise<User> {
    return this.patch<User>(`/users/${id}/screen-time`, { minutes });
  }
}

/**
 * Export singleton instance for use throughout the application
 */
export const userApi = new UserApiClient();
