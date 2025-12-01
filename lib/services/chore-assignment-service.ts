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
   * Business rule: Parents only (authorization checked at API level)
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
   * Get assignments for a specific date, optionally filtered by kid
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
   * Mark a chore assignment as completed
   * Business rule: Assigned kid or parents can complete
   * (authorization checked at API level)
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
   * Mark a chore assignment as uncompleted
   * Business rule: Parents only (authorization checked at API level)
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
   * Get assignment by ID
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
