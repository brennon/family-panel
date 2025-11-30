/**
 * User API Client
 * Handles all user-related API requests
 */

import { ApiClient } from './client';
import type { User, CreateUserData, UpdateUserData } from '@/types';

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
