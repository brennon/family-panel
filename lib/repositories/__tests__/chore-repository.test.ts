/**
 * Tests for ChoreRepository
 * Repository layer handles data access and transforms between DB and domain types
 */

import { ChoreRepository } from '../chore-repository';
import { createMockSupabaseClient } from '@/lib/test-utils/supabase-mock';
import type { Chore, CreateChoreData, UpdateChoreData } from '@/types';

describe('ChoreRepository', () => {
  let repository: ChoreRepository;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    repository = new ChoreRepository(mockSupabase as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return chore when found', async () => {
      const mockDbChore = {
        id: '123',
        name: 'Wash dishes',
        description: 'Clean all dishes in the sink',
        monetary_value_cents: 500,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from().single.mockResolvedValue({
        data: mockDbChore,
        error: null,
      });

      const chore = await repository.findById('123');

      expect(chore).toEqual({
        id: '123',
        name: 'Wash dishes',
        description: 'Clean all dishes in the sink',
        monetaryValueCents: 500,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      });
      expect(mockSupabase.from).toHaveBeenCalledWith('chores');
      expect(mockSupabase.from().select).toHaveBeenCalledWith('*');
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('id', '123');
    });

    it('should return null when chore not found', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Row not found' } as any,
      });

      const chore = await repository.findById('999');

      expect(chore).toBeNull();
    });

    it('should throw error on database failure', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST500', message: 'Database error' } as any,
      });

      await expect(repository.findById('123')).rejects.toThrow(
        'Failed to find chore'
      );
    });
  });

  describe('findAll', () => {
    it('should return all chores', async () => {
      const mockDbChores = [
        {
          id: '1',
          name: 'Wash dishes',
          description: 'Clean all dishes',
          monetary_value_cents: 500,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'Take out trash',
          description: null,
          monetary_value_cents: 250,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockSupabase.from().select.mockResolvedValue({
        data: mockDbChores,
        error: null,
      });

      const chores = await repository.findAll();

      expect(chores).toHaveLength(2);
      expect(chores[0].name).toBe('Wash dishes');
      expect(chores[1].name).toBe('Take out trash');
      expect(chores[1].description).toBeNull();
    });

    it('should return empty array when no chores exist', async () => {
      mockSupabase.from().select.mockResolvedValue({
        data: [],
        error: null,
      });

      const chores = await repository.findAll();

      expect(chores).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      mockSupabase.from().select.mockResolvedValue({
        data: null,
        error: { code: 'PGRST500', message: 'Database error' } as any,
      });

      await expect(repository.findAll()).rejects.toThrow(
        'Failed to fetch chores'
      );
    });
  });

  describe('create', () => {
    it('should create a new chore with all fields', async () => {
      const createData: CreateChoreData = {
        name: 'Vacuum floor',
        description: 'Vacuum all carpets',
        monetaryValueCents: 750,
      };

      const mockDbChore = {
        id: 'new-id',
        name: 'Vacuum floor',
        description: 'Vacuum all carpets',
        monetary_value_cents: 750,
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      };

      mockSupabase.from().single.mockResolvedValue({
        data: mockDbChore,
        error: null,
      });

      const chore = await repository.create(createData);

      expect(chore.id).toBe('new-id');
      expect(chore.name).toBe('Vacuum floor');
      expect(chore.description).toBe('Vacuum all carpets');
      expect(chore.monetaryValueCents).toBe(750);
      expect(mockSupabase.from).toHaveBeenCalledWith('chores');
      expect(mockSupabase.from().insert).toHaveBeenCalled();
    });

    it('should create chore with default monetary value', async () => {
      const createData: CreateChoreData = {
        name: 'Make bed',
      };

      const mockDbChore = {
        id: 'new-id',
        name: 'Make bed',
        description: null,
        monetary_value_cents: 0,
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      };

      mockSupabase.from().single.mockResolvedValue({
        data: mockDbChore,
        error: null,
      });

      const chore = await repository.create(createData);

      expect(chore.monetaryValueCents).toBe(0);
      expect(chore.description).toBeNull();
    });

    it('should throw error when creation fails', async () => {
      const createData: CreateChoreData = {
        name: 'New chore',
      };

      mockSupabase.from().single.mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'Constraint violation' } as any,
      });

      await expect(repository.create(createData)).rejects.toThrow(
        'Failed to create chore'
      );
    });
  });

  describe('update', () => {
    it('should update existing chore', async () => {
      const updateData: UpdateChoreData = {
        name: 'Updated name',
        monetaryValueCents: 1000,
      };

      const mockDbChore = {
        id: '123',
        name: 'Updated name',
        description: 'Original description',
        monetary_value_cents: 1000,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      };

      mockSupabase.from().single.mockResolvedValue({
        data: mockDbChore,
        error: null,
      });

      const chore = await repository.update('123', updateData);

      expect(chore.name).toBe('Updated name');
      expect(chore.monetaryValueCents).toBe(1000);
      expect(mockSupabase.from().update).toHaveBeenCalled();
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('id', '123');
    });

    it('should update only provided fields', async () => {
      const updateData: UpdateChoreData = {
        description: 'New description only',
      };

      const mockDbChore = {
        id: '123',
        name: 'Original name',
        description: 'New description only',
        monetary_value_cents: 500,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      };

      mockSupabase.from().single.mockResolvedValue({
        data: mockDbChore,
        error: null,
      });

      const chore = await repository.update('123', updateData);

      expect(chore.description).toBe('New description only');
    });

    it('should throw error when chore not found', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Row not found' } as any,
      });

      await expect(
        repository.update('999', { name: 'New Name' })
      ).rejects.toThrow('Failed to update chore');
    });
  });

  describe('delete', () => {
    it('should delete existing chore', async () => {
      mockSupabase.from().eq.mockResolvedValue({
        data: null,
        error: null,
      });

      await repository.delete('123');

      expect(mockSupabase.from).toHaveBeenCalledWith('chores');
      expect(mockSupabase.from().delete).toHaveBeenCalled();
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('id', '123');
    });

    it('should throw error when deletion fails', async () => {
      mockSupabase.from().eq.mockResolvedValue({
        data: null,
        error: { code: 'PGRST500', message: 'Database error' } as any,
      });

      await expect(repository.delete('123')).rejects.toThrow(
        'Failed to delete chore'
      );
    });
  });
});
