/**
 * ChoreAssignmentService
 * Business logic layer for ChoreAssignment operations
 * Orchestrates repository calls and implements business rules
 */

import type { ChoreAssignmentRepository } from '@/lib/repositories';
import type {
  ChoreAssignment,
  CreateChoreAssignmentData,
  UpdateChoreAssignmentData,
} from '@/types';

export class ChoreAssignmentService {
  constructor(private repository: ChoreAssignmentRepository) {}

  /**
   * Assign a chore to a kid for a specific date
   *
   * Business rule: Parents only (authorization checked at API level)
   *
   * @param choreId - UUID of the chore to assign
   * @param userId - UUID of the kid to assign the chore to
   * @param assignedDate - Date the chore is assigned for
   * @returns Promise resolving to the created ChoreAssignment
   * @throws Error if assignment creation fails
   *
   * @example
   * const assignment = await service.assignChore(
   *   'chore-123',
   *   'kid-456',
   *   new Date('2024-01-15')
   * );
   * console.log(`Assigned chore ${assignment.choreId} to kid ${assignment.userId}`);
   */
  async assignChore(
    choreId: string,
    userId: string,
    assignedDate: Date
  ): Promise<ChoreAssignment> {
    try {
      const data: CreateChoreAssignmentData = {
        choreId,
        userId,
        assignedDate,
      };
      return await this.repository.create(data);
    } catch (error) {
      throw new Error(
        `Failed to assign chore: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get chore assignments for a specific date, optionally filtered by kid
   *
   * @param date - Date to query assignments for
   * @param kidId - Optional UUID of kid to filter assignments by
   * @returns Promise resolving to array of ChoreAssignments (empty if none found)
   * @throws Error if query fails
   *
   * @example
   * // Get all assignments for a date
   * const allAssignments = await service.getAssignmentsForDate(
   *   new Date('2024-01-15')
   * );
   *
   * @example
   * // Get assignments for specific kid
   * const kidAssignments = await service.getAssignmentsForDate(
   *   new Date('2024-01-15'),
   *   'kid-456'
   * );
   */
  async getAssignmentsForDate(
    date: Date,
    kidId?: string
  ): Promise<ChoreAssignment[]> {
    try {
      return await this.repository.findByDate(date, kidId);
    } catch (error) {
      throw new Error(
        `Failed to get assignments for date: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Mark a chore assignment as completed with a timestamp
   *
   * Business rule: Assigned kid or parents can complete
   * (authorization checked at API level)
   *
   * @param assignmentId - UUID of the assignment to complete
   * @returns Promise resolving to the updated ChoreAssignment with completion timestamp
   * @throws Error if update fails or assignment not found
   *
   * @example
   * const completed = await service.completeChore('assignment-123');
   * console.log(`Chore completed at ${completed.completedAt}`);
   */
  async completeChore(assignmentId: string): Promise<ChoreAssignment> {
    try {
      const data: UpdateChoreAssignmentData = {
        completed: true,
        completedAt: new Date(),
      };
      return await this.repository.update(assignmentId, data);
    } catch (error) {
      throw new Error(
        `Failed to complete chore: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Mark a chore assignment as uncompleted and clear the completion timestamp
   *
   * Business rule: Parents only (authorization checked at API level)
   *
   * @param assignmentId - UUID of the assignment to uncomplete
   * @returns Promise resolving to the updated ChoreAssignment with cleared completion data
   * @throws Error if update fails or assignment not found
   *
   * @example
   * const reverted = await service.uncompleteChore('assignment-123');
   * console.log(`Chore unmarked: completed=${reverted.completed}`); // false
   */
  async uncompleteChore(assignmentId: string): Promise<ChoreAssignment> {
    try {
      const data: UpdateChoreAssignmentData = {
        completed: false,
        completedAt: null,
      };
      return await this.repository.update(assignmentId, data);
    } catch (error) {
      throw new Error(
        `Failed to uncomplete chore: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get a chore assignment by its ID
   *
   * @param id - UUID of the assignment to retrieve
   * @returns Promise resolving to ChoreAssignment if found, null otherwise
   * @throws Error if database query fails (non-404 errors)
   *
   * @example
   * const assignment = await service.getAssignmentById('assignment-123');
   * if (assignment) {
   *   console.log(`Found assignment for chore ${assignment.choreId}`);
   * } else {
   *   console.log('Assignment not found');
   * }
   */
  async getAssignmentById(id: string): Promise<ChoreAssignment | null> {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      throw new Error(
        `Failed to get assignment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
