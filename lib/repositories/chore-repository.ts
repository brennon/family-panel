/**
 * ChoreRepository
 * Data access layer for Chore entity
 * Handles all database operations and transforms between DB and domain types
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { Chore, CreateChoreData, UpdateChoreData } from '@/types';

type DbChore = Database['public']['Tables']['chores']['Row'];
type DbChoreInsert = Database['public']['Tables']['chores']['Insert'];
type DbChoreUpdate = Database['public']['Tables']['chores']['Update'];

export class ChoreRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Transform database row to domain model
   */
  private toDomain(dbChore: DbChore): Chore {
    return {
      id: dbChore.id,
      name: dbChore.name,
      description: dbChore.description,
      monetaryValueCents: dbChore.monetary_value_cents,
      createdAt: new Date(dbChore.created_at),
      updatedAt: new Date(dbChore.updated_at),
    };
  }

  /**
   * Transform domain create data to database insert
   */
  private toDbInsert(data: CreateChoreData): DbChoreInsert {
    return {
      name: data.name,
      description: data.description,
      monetary_value_cents: data.monetaryValueCents,
    };
  }

  /**
   * Transform domain update data to database update
   */
  private toDbUpdate(data: UpdateChoreData): DbChoreUpdate {
    return {
      name: data.name,
      description: data.description,
      monetary_value_cents: data.monetaryValueCents,
    };
  }

  /**
   * Find chore by ID
   */
  async findById(id: string): Promise<Chore | null> {
    const { data, error } = await this.supabase
      .from('chores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // PGRST116 is "not found" error code
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find chore: ${error.message}`);
    }

    return data ? this.toDomain(data) : null;
  }

  /**
   * Find all chores
   */
  async findAll(): Promise<Chore[]> {
    const { data, error } = await this.supabase.from('chores').select('*');

    if (error) {
      throw new Error(`Failed to fetch chores: ${error.message}`);
    }

    return data ? data.map((chore) => this.toDomain(chore)) : [];
  }

  /**
   * Create a new chore
   */
  async create(data: CreateChoreData): Promise<Chore> {
    const dbInsert = this.toDbInsert(data);
    const { data: created, error } = await this.supabase
      .from('chores')
      // @ts-expect-error - Supabase type inference issue with generated types
      .insert([dbInsert])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create chore: ${error.message}`);
    }

    return this.toDomain(created);
  }

  /**
   * Update an existing chore
   */
  async update(id: string, data: UpdateChoreData): Promise<Chore> {
    const dbUpdate = this.toDbUpdate(data);
    const { data: updated, error } = await this.supabase
      .from('chores')
      // @ts-expect-error - Supabase type inference issue with generated types
      .update(dbUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update chore: ${error.message}`);
    }

    return this.toDomain(updated);
  }

  /**
   * Delete a chore
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from('chores').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete chore: ${error.message}`);
    }
  }
}
