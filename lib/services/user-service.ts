/**
 * UserService
 * Business logic layer for User operations
 * Orchestrates repository calls and implements business rules
 */

import type { UserRepository } from '@/lib/repositories';
import type {
  User,
  CreateUserData,
  UpdateUserData,
  UserFilters,
} from '@/types';

export class UserService {
  constructor(private repository: UserRepository) {}

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      throw new Error(
        `Failed to get user ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get user by email (normalized to lowercase)
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase();
    return await this.repository.findByEmail(normalizedEmail);
  }

  /**
   * Get all users with optional filters
   */
  async getAllUsers(filters?: UserFilters): Promise<User[]> {
    return await this.repository.findAll(filters);
  }

  /**
   * Get all kids (users with kid role)
   */
  async getKids(): Promise<User[]> {
    return await this.repository.findAll({ role: 'kid' });
  }

  /**
   * Get all parents (users with parent role)
   */
  async getParents(): Promise<User[]> {
    return await this.repository.findAll({ role: 'parent' });
  }

  /**
   * Create a new user (email normalized to lowercase)
   */
  async createUser(data: CreateUserData): Promise<User> {
    try {
      const normalizedData = {
        ...data,
        email: data.email.toLowerCase(),
      };
      return await this.repository.create(normalizedData);
    } catch (error) {
      throw new Error(
        `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update an existing user (email normalized if provided)
   */
  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    try {
      const normalizedData = {
        ...data,
        ...(data.email && { email: data.email.toLowerCase() }),
      };
      return await this.repository.update(id, normalizedData);
    } catch (error) {
      throw new Error(
        `Failed to update user ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error) {
      throw new Error(
        `Failed to delete user ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update user's daily screen time allowance
   * Business rule: screen time must be non-negative
   */
  async updateScreenTime(id: string, minutes: number): Promise<User> {
    if (minutes < 0) {
      throw new Error('Screen time must be a positive number');
    }

    return await this.repository.update(id, {
      screenTimeDailyMinutes: minutes,
    });
  }
}
