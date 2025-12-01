/**
 * Domain types for ChoreAssignment entity
 * These are the business domain models, separate from database types
 */

/**
 * ChoreAssignment domain model
 * Represents a chore assigned to a kid on a specific date
 */
export interface ChoreAssignment {
  id: string;
  choreId: string;
  userId: string;
  assignedDate: Date;
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ChoreAssignment creation data
 * Fields required when creating a new assignment
 */
export interface CreateChoreAssignmentData {
  choreId: string;
  userId: string;
  assignedDate: Date;
}

/**
 * ChoreAssignment update data
 * Fields that can be updated on an existing assignment
 */
export interface UpdateChoreAssignmentData {
  completed?: boolean;
  completedAt?: Date | null;
}
