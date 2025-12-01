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
   * Find a chore assignment by its ID
   *
   * @param id - UUID of the assignment to find
   * @returns Promise resolving to ChoreAssignment if found, null otherwise
   * @throws Error if database query fails (non-404 errors)
   *
   * @example
   * const assignment = await repository.findById('assignment-123');
   * if (assignment) {
   *   console.log(`Chore ${assignment.choreId} assigned to ${assignment.userId}`);
   * }
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
   * Find chore assignments by date, optionally filtered by kid
   *
   * @param date - Date to query assignments for
   * @param kidId - Optional UUID of kid to filter assignments by
   * @returns Promise resolving to array of ChoreAssignments (empty if none found)
   * @throws Error if database query fails
   *
   * @example
   * // Get all assignments for a date
   * const allAssignments = await repository.findByDate(new Date('2024-01-15'));
   *
   * @example
   * // Get assignments for specific kid
   * const kidAssignments = await repository.findByDate(
   *   new Date('2024-01-15'),
   *   'kid-123'
   * );
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
   * Create a new chore assignment
   *
   * @param data - Assignment creation data (choreId, userId, assignedDate)
   * @returns Promise resolving to the created ChoreAssignment
   * @throws Error if database insert fails (e.g., constraint violations)
   *
   * @example
   * const assignment = await repository.create({
   *   choreId: 'chore-123',
   *   userId: 'kid-456',
   *   assignedDate: new Date('2024-01-15')
   * });
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
   * Update an existing chore assignment
   *
   * Typically used to update completion status and timestamp.
   *
   * @param id - UUID of the assignment to update
   * @param data - Assignment update data (completed, completedAt)
   * @returns Promise resolving to the updated ChoreAssignment
   * @throws Error if database update fails or assignment not found
   *
   * @example
   * // Mark as completed
   * const updated = await repository.update('assignment-123', {
   *   completed: true,
   *   completedAt: new Date()
   * });
   *
   * @example
   * // Mark as uncompleted
   * const reverted = await repository.update('assignment-123', {
   *   completed: false,
   *   completedAt: null
   * });
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
   * Delete a chore assignment
   *
   * @param id - UUID of the assignment to delete
   * @returns Promise resolving when deletion is complete
   * @throws Error if database deletion fails
   *
   * @example
   * await repository.delete('assignment-123');
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
