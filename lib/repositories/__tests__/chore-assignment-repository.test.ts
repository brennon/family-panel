/**
 * Tests for ChoreAssignmentRepository
 * Repository layer handles data access and transforms between DB and domain types
 */

import { ChoreAssignmentRepository } from '../chore-assignment-repository';
import { createMockSupabaseClient } from '@/lib/test-utils/supabase-mock';
import type {
  ChoreAssignment,
  CreateChoreAssignmentData,
  UpdateChoreAssignmentData,
} from '@/types';

describe('ChoreAssignmentRepository', () => {
  let repository: ChoreAssignmentRepository;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    repository = new ChoreAssignmentRepository(mockSupabase as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return assignment when found', async () => {
      const mockDbAssignment = {
        id: '123',
        chore_id: 'chore-1',
        user_id: 'kid-1',
        assigned_date: '2024-01-15',
        completed: false,
        completed_at: null,
        created_at: '2024-01-14T00:00:00Z',
        updated_at: '2024-01-14T00:00:00Z',
      };

      mockSupabase.from().single.mockResolvedValue({
        data: mockDbAssignment,
        error: null,
      });

      const assignment = await repository.findById('123');

      expect(assignment).toEqual({
        id: '123',
        choreId: 'chore-1',
        userId: 'kid-1',
        assignedDate: new Date('2024-01-15'),
        completed: false,
        completedAt: null,
        createdAt: new Date('2024-01-14T00:00:00Z'),
        updatedAt: new Date('2024-01-14T00:00:00Z'),
      });
      expect(mockSupabase.from).toHaveBeenCalledWith('chore_assignments');
    });

    it('should return null when assignment not found', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Row not found' } as any,
      });

      const assignment = await repository.findById('999');

      expect(assignment).toBeNull();
    });

    it('should throw error on database failure', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST500', message: 'Database error' } as any,
      });

      await expect(repository.findById('123')).rejects.toThrow(
        'Failed to find chore assignment'
      );
    });
  });

  describe('findByDate', () => {
    it('should return assignments for a specific date', async () => {
      const mockDbAssignments = [
        {
          id: '1',
          chore_id: 'chore-1',
          user_id: 'kid-1',
          assigned_date: '2024-01-15',
          completed: false,
          completed_at: null,
          created_at: '2024-01-14T00:00:00Z',
          updated_at: '2024-01-14T00:00:00Z',
        },
        {
          id: '2',
          chore_id: 'chore-2',
          user_id: 'kid-2',
          assigned_date: '2024-01-15',
          completed: true,
          completed_at: '2024-01-15T10:30:00Z',
          created_at: '2024-01-14T00:00:00Z',
          updated_at: '2024-01-15T10:30:00Z',
        },
      ];

      // Mock the final result of the query chain
      mockSupabase.from().eq.mockResolvedValue({
        data: mockDbAssignments,
        error: null,
      });

      const date = new Date('2024-01-15');
      const assignments = await repository.findByDate(date);

      expect(assignments).toHaveLength(2);
      expect(assignments[0].choreId).toBe('chore-1');
      expect(assignments[1].choreId).toBe('chore-2');
      expect(assignments[1].completed).toBe(true);
      expect(mockSupabase.from().eq).toHaveBeenCalledWith(
        'assigned_date',
        '2024-01-15'
      );
    });

    it('should return assignments for specific kid and date', async () => {
      const mockDbAssignments = [
        {
          id: '1',
          chore_id: 'chore-1',
          user_id: 'kid-1',
          assigned_date: '2024-01-15',
          completed: false,
          completed_at: null,
          created_at: '2024-01-14T00:00:00Z',
          updated_at: '2024-01-14T00:00:00Z',
        },
      ];

      // First .eq() returns a query builder that supports chaining another .eq()
      const secondEqMock = jest.fn().mockResolvedValue({
        data: mockDbAssignments,
        error: null,
      });

      mockSupabase.from().eq.mockReturnValue({
        eq: secondEqMock,
      });

      const date = new Date('2024-01-15');
      const assignments = await repository.findByDate(date, 'kid-1');

      expect(assignments).toHaveLength(1);
      expect(assignments[0].userId).toBe('kid-1');
      expect(secondEqMock).toHaveBeenCalledWith('user_id', 'kid-1');
    });

    it('should return empty array when no assignments exist', async () => {
      mockSupabase.from().eq.mockResolvedValue({
        data: [],
        error: null,
      });

      const date = new Date('2024-01-15');
      const assignments = await repository.findByDate(date);

      expect(assignments).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      mockSupabase.from().eq.mockResolvedValue({
        data: null,
        error: { code: 'PGRST500', message: 'Database error' } as any,
      });

      const date = new Date('2024-01-15');
      await expect(repository.findByDate(date)).rejects.toThrow(
        'Failed to fetch chore assignments'
      );
    });
  });

  describe('create', () => {
    it('should create a new assignment', async () => {
      const createData: CreateChoreAssignmentData = {
        choreId: 'chore-1',
        userId: 'kid-1',
        assignedDate: new Date('2024-01-15'),
      };

      const mockDbAssignment = {
        id: 'new-id',
        chore_id: 'chore-1',
        user_id: 'kid-1',
        assigned_date: '2024-01-15',
        completed: false,
        completed_at: null,
        created_at: '2024-01-14T00:00:00Z',
        updated_at: '2024-01-14T00:00:00Z',
      };

      mockSupabase.from().single.mockResolvedValue({
        data: mockDbAssignment,
        error: null,
      });

      const assignment = await repository.create(createData);

      expect(assignment.id).toBe('new-id');
      expect(assignment.choreId).toBe('chore-1');
      expect(assignment.userId).toBe('kid-1');
      expect(assignment.completed).toBe(false);
      expect(assignment.completedAt).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('chore_assignments');
      expect(mockSupabase.from().insert).toHaveBeenCalled();
    });

    it('should throw error when creation fails', async () => {
      const createData: CreateChoreAssignmentData = {
        choreId: 'chore-1',
        userId: 'kid-1',
        assignedDate: new Date('2024-01-15'),
      };

      mockSupabase.from().single.mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'Constraint violation' } as any,
      });

      await expect(repository.create(createData)).rejects.toThrow(
        'Failed to create chore assignment'
      );
    });
  });

  describe('update', () => {
    it('should mark assignment as completed', async () => {
      const updateData: UpdateChoreAssignmentData = {
        completed: true,
        completedAt: new Date('2024-01-15T10:30:00Z'),
      };

      const mockDbAssignment = {
        id: '123',
        chore_id: 'chore-1',
        user_id: 'kid-1',
        assigned_date: '2024-01-15',
        completed: true,
        completed_at: '2024-01-15T10:30:00Z',
        created_at: '2024-01-14T00:00:00Z',
        updated_at: '2024-01-15T10:30:00Z',
      };

      mockSupabase.from().single.mockResolvedValue({
        data: mockDbAssignment,
        error: null,
      });

      const assignment = await repository.update('123', updateData);

      expect(assignment.completed).toBe(true);
      expect(assignment.completedAt).toEqual(new Date('2024-01-15T10:30:00Z'));
      expect(mockSupabase.from().update).toHaveBeenCalled();
    });

    it('should mark assignment as uncompleted', async () => {
      const updateData: UpdateChoreAssignmentData = {
        completed: false,
        completedAt: null,
      };

      const mockDbAssignment = {
        id: '123',
        chore_id: 'chore-1',
        user_id: 'kid-1',
        assigned_date: '2024-01-15',
        completed: false,
        completed_at: null,
        created_at: '2024-01-14T00:00:00Z',
        updated_at: '2024-01-15T11:00:00Z',
      };

      mockSupabase.from().single.mockResolvedValue({
        data: mockDbAssignment,
        error: null,
      });

      const assignment = await repository.update('123', updateData);

      expect(assignment.completed).toBe(false);
      expect(assignment.completedAt).toBeNull();
    });

    it('should throw error when assignment not found', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Row not found' } as any,
      });

      await expect(
        repository.update('999', { completed: true })
      ).rejects.toThrow('Failed to update chore assignment');
    });
  });

  describe('delete', () => {
    it('should delete existing assignment', async () => {
      mockSupabase.from().eq.mockResolvedValue({
        data: null,
        error: null,
      });

      await repository.delete('123');

      expect(mockSupabase.from).toHaveBeenCalledWith('chore_assignments');
      expect(mockSupabase.from().delete).toHaveBeenCalled();
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('id', '123');
    });

    it('should throw error when deletion fails', async () => {
      mockSupabase.from().eq.mockResolvedValue({
        data: null,
        error: { code: 'PGRST500', message: 'Database error' } as any,
      });

      await expect(repository.delete('123')).rejects.toThrow(
        'Failed to delete chore assignment'
      );
    });
  });
});
