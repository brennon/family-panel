/**
 * ChoreService
 * Business logic layer for Chore operations
 * Orchestrates repository calls and implements business rules
 */

import type { ChoreRepository } from '@/lib/repositories';
import type { Chore, CreateChoreData, UpdateChoreData } from '@/types';

export class ChoreService {
  constructor(private repository: ChoreRepository) {}

  /**
   * Get chore by ID
   */
  async getChoreById(id: string): Promise<Chore | null> {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      throw new Error(
        `Failed to get chore ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get all chores
   */
  async getAllChores(): Promise<Chore[]> {
    return await this.repository.findAll();
  }

  /**
   * Create a new chore
   * Business rule: monetary value must be in cents (integer)
   */
  async createChore(data: CreateChoreData): Promise<Chore> {
    try {
      return await this.repository.create(data);
    } catch (error) {
      throw new Error(
        `Failed to create chore: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update an existing chore
   */
  async updateChore(id: string, data: UpdateChoreData): Promise<Chore> {
    try {
      return await this.repository.update(id, data);
    } catch (error) {
      throw new Error(
        `Failed to update chore ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete a chore
   */
  async deleteChore(id: string): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error) {
      throw new Error(
        `Failed to delete chore ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
