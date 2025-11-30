/**
 * Domain types for User entity
 * These are the business domain models, separate from database types
 */

import { UserRole } from '@/lib/supabase/types';

/**
 * User domain model
 * Represents a user in the application (parent or kid)
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  screenTimeDailyMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User creation data
 * Fields required when creating a new user
 */
export interface CreateUserData {
  email: string;
  name: string;
  role: UserRole;
  screenTimeDailyMinutes?: number;
}

/**
 * User update data
 * Fields that can be updated on an existing user
 */
export interface UpdateUserData {
  name?: string;
  email?: string;
  screenTimeDailyMinutes?: number;
}

/**
 * User filter options for queries
 */
export interface UserFilters {
  role?: UserRole;
  email?: string;
}
