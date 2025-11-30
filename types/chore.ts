/**
 * Domain types for Chore entity
 * These are the business domain models, separate from database types
 */

/**
 * Chore domain model
 * Represents a chore that can be assigned to kids
 */
export interface Chore {
  id: string;
  name: string;
  description: string | null;
  monetaryValueCents: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Chore creation data
 * Fields required when creating a new chore
 */
export interface CreateChoreData {
  name: string;
  description?: string | null;
  monetaryValueCents?: number;
}

/**
 * Chore update data
 * Fields that can be updated on an existing chore
 */
export interface UpdateChoreData {
  name?: string;
  description?: string | null;
  monetaryValueCents?: number;
}
