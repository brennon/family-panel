/**
 * UserRepository
 * Data access layer for User entity
 * Handles all database operations and transforms between DB and domain types
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type {
  User,
  CreateUserData,
  UpdateUserData,
  UserFilters,
} from '@/types';

type DbUser = Database['public']['Tables']['users']['Row'];
type DbUserInsert = Database['public']['Tables']['users']['Insert'];
type DbUserUpdate = Database['public']['Tables']['users']['Update'];

export class UserRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Transform database row to domain model
   */
  private toDomain(dbUser: DbUser): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      screenTimeDailyMinutes: dbUser.screen_time_daily_minutes,
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at),
    };
  }

  /**
   * Transform domain create data to database insert
   */
  private toDbInsert(data: CreateUserData): DbUserInsert {
    return {
      email: data.email,
      name: data.name,
      role: data.role,
      screen_time_daily_minutes: data.screenTimeDailyMinutes,
    };
  }

  /**
   * Transform domain update data to database update
   */
  private toDbUpdate(data: UpdateUserData): DbUserUpdate {
    return {
      name: data.name,
      email: data.email,
      screen_time_daily_minutes: data.screenTimeDailyMinutes,
    };
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // PGRST116 is "not found" error code
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return data ? this.toDomain(data) : null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return data ? this.toDomain(data) : null;
  }

  /**
   * Find all users with optional filters
   */
  async findAll(filters?: UserFilters): Promise<User[]> {
    let query = this.supabase.from('users').select('*');

    // Apply filters if provided
    if (filters?.role) {
      query = query.eq('role', filters.role);
    }
    if (filters?.email) {
      query = query.eq('email', filters.email);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return data ? data.map((user) => this.toDomain(user)) : [];
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserData): Promise<User> {
    const dbInsert = this.toDbInsert(data);
    const { data: created, error } = await this.supabase
      .from('users')
      // @ts-expect-error - Supabase type inference issue with generated types
      .insert([dbInsert])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return this.toDomain(created);
  }

  /**
   * Update an existing user
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    const dbUpdate = this.toDbUpdate(data);
    const { data: updated, error } = await this.supabase
      .from('users')
      // @ts-expect-error - Supabase type inference issue with generated types
      .update(dbUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return this.toDomain(updated);
  }

  /**
   * Delete a user
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from('users').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }
}
