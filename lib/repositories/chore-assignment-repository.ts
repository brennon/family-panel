/**
 * ChoreAssignmentRepository
 * Data access layer for ChoreAssignment entity
 * Handles all database operations and transforms between DB and domain types
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type {
  ChoreAssignment,
  CreateChoreAssignmentData,
  UpdateChoreAssignmentData,
} from '@/types';

type DbChoreAssignment =
  Database['public']['Tables']['chore_assignments']['Row'];
type DbChoreAssignmentInsert =
  Database['public']['Tables']['chore_assignments']['Insert'];
type DbChoreAssignmentUpdate =
  Database['public']['Tables']['chore_assignments']['Update'];

export class ChoreAssignmentRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Transform database row to domain model
   */
  private toDomain(dbAssignment: DbChoreAssignment): ChoreAssignment {
    return {
      id: dbAssignment.id,
      choreId: dbAssignment.chore_id,
      userId: dbAssignment.user_id,
      assignedDate: new Date(dbAssignment.assigned_date),
      completed: dbAssignment.completed,
      completedAt: dbAssignment.completed_at
        ? new Date(dbAssignment.completed_at)
        : null,
      createdAt: new Date(dbAssignment.created_at),
      updatedAt: new Date(dbAssignment.updated_at),
    };
  }

  /**
   * Transform domain create data to database insert
   */
  private toDbInsert(
    data: CreateChoreAssignmentData
  ): DbChoreAssignmentInsert {
    return {
      chore_id: data.choreId,
      user_id: data.userId,
      assigned_date: data.assignedDate.toISOString().split('T')[0], // YYYY-MM-DD
    };
  }

  /**
   * Transform domain update data to database update
   */
  private toDbUpdate(
    data: UpdateChoreAssignmentData
  ): DbChoreAssignmentUpdate {
    return {
      completed: data.completed,
      completed_at: data.completedAt
        ? data.completedAt.toISOString()
        : data.completedAt === null
          ? null
          : undefined,
    };
  }

  /**
   * Find assignment by ID
   */
  async findById(id: string): Promise<ChoreAssignment | null> {
    const { data, error } = await this.supabase
      .from('chore_assignments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // PGRST116 is "not found" error code
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find chore assignment: ${error.message}`);
    }

    return data ? this.toDomain(data) : null;
  }

  /**
   * Find assignments by date and optionally by kid
   */
  async findByDate(
    date: Date,
    kidId?: string
  ): Promise<ChoreAssignment[]> {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    const query = this.supabase
      .from('chore_assignments')
      .select('*')
      .eq('assigned_date', dateStr);

    const { data, error } = kidId
      ? await query.eq('user_id', kidId)
      : await query;

    if (error) {
      throw new Error(`Failed to fetch chore assignments: ${error.message}`);
    }

    return data ? data.map((assignment) => this.toDomain(assignment)) : [];
  }

  /**
   * Create a new assignment
   */
  async create(data: CreateChoreAssignmentData): Promise<ChoreAssignment> {
    const dbInsert = this.toDbInsert(data);
    const { data: created, error } = await this.supabase
      .from('chore_assignments')
      // @ts-expect-error - Supabase type inference issue with generated types
      .insert([dbInsert])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create chore assignment: ${error.message}`);
    }

    return this.toDomain(created);
  }

  /**
   * Update an existing assignment
   */
  async update(
    id: string,
    data: UpdateChoreAssignmentData
  ): Promise<ChoreAssignment> {
    const dbUpdate = this.toDbUpdate(data);
    const { data: updated, error } = await this.supabase
      .from('chore_assignments')
      // @ts-expect-error - Supabase type inference issue with generated types
      .update(dbUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update chore assignment: ${error.message}`);
    }

    return this.toDomain(updated);
  }

  /**
   * Delete an assignment
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('chore_assignments')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete chore assignment: ${error.message}`);
    }
  }
}
