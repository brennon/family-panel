/**
 * Tests for ChoreAssignmentService
 * Service layer implements business logic and orchestrates repository calls
 */

import { ChoreAssignmentService } from '../chore-assignment-service';
import type { ChoreAssignmentRepository } from '@/lib/repositories';
import type {
  ChoreAssignment,
  CreateChoreAssignmentData,
  UpdateChoreAssignmentData,
} from '@/types';

describe('ChoreAssignmentService', () => {
  let service: ChoreAssignmentService;
  let mockRepository: jest.Mocked<ChoreAssignmentRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findByDate: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    service = new ChoreAssignmentService(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('assignChore', () => {
    it('should assign a chore to a kid', async () => {
      const mockAssignment: ChoreAssignment = {
        id: 'assignment-1',
        choreId: 'chore-1',
        userId: 'kid-1',
        assignedDate: new Date('2024-01-15'),
        completed: false,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockResolvedValue(mockAssignment);

      const result = await service.assignChore(
        'chore-1',
        'kid-1',
        new Date('2024-01-15')
      );

      expect(result).toEqual(mockAssignment);
      expect(mockRepository.create).toHaveBeenCalledWith({
        choreId: 'chore-1',
        userId: 'kid-1',
        assignedDate: new Date('2024-01-15'),
      });
    });

    it('should throw error when assignment creation fails', async () => {
      mockRepository.create.mockRejectedValue(
        new Error('Database constraint violation')
      );

      await expect(
        service.assignChore('chore-1', 'kid-1', new Date('2024-01-15'))
      ).rejects.toThrow('Failed to assign chore');
    });
  });

  describe('getAssignmentsForDate', () => {
    it('should get all assignments for a specific date', async () => {
      const mockAssignments: ChoreAssignment[] = [
        {
          id: '1',
          choreId: 'chore-1',
          userId: 'kid-1',
          assignedDate: new Date('2024-01-15'),
          completed: false,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          choreId: 'chore-2',
          userId: 'kid-2',
          assignedDate: new Date('2024-01-15'),
          completed: true,
          completedAt: new Date('2024-01-15T10:30:00Z'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.findByDate.mockResolvedValue(mockAssignments);

      const result = await service.getAssignmentsForDate(
        new Date('2024-01-15')
      );

      expect(result).toEqual(mockAssignments);
      expect(mockRepository.findByDate).toHaveBeenCalledWith(
        new Date('2024-01-15'),
        undefined
      );
    });

    it('should get assignments for specific kid and date', async () => {
      const mockAssignments: ChoreAssignment[] = [
        {
          id: '1',
          choreId: 'chore-1',
          userId: 'kid-1',
          assignedDate: new Date('2024-01-15'),
          completed: false,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.findByDate.mockResolvedValue(mockAssignments);

      const result = await service.getAssignmentsForDate(
        new Date('2024-01-15'),
        'kid-1'
      );

      expect(result).toEqual(mockAssignments);
      expect(mockRepository.findByDate).toHaveBeenCalledWith(
        new Date('2024-01-15'),
        'kid-1'
      );
    });

    it('should throw error when fetch fails', async () => {
      mockRepository.findByDate.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        service.getAssignmentsForDate(new Date('2024-01-15'))
      ).rejects.toThrow('Failed to get assignments for date');
    });
  });

  describe('completeChore', () => {
    it('should mark chore as completed with timestamp', async () => {
      const mockUpdatedAssignment: ChoreAssignment = {
        id: 'assignment-1',
        choreId: 'chore-1',
        userId: 'kid-1',
        assignedDate: new Date('2024-01-15'),
        completed: true,
        completedAt: new Date('2024-01-15T10:30:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.update.mockResolvedValue(mockUpdatedAssignment);

      const result = await service.completeChore('assignment-1');

      expect(result).toEqual(mockUpdatedAssignment);
      expect(mockRepository.update).toHaveBeenCalledWith(
        'assignment-1',
        expect.objectContaining({
          completed: true,
          completedAt: expect.any(Date),
        })
      );
    });

    it('should throw error when update fails', async () => {
      mockRepository.update.mockRejectedValue(
        new Error('Assignment not found')
      );

      await expect(service.completeChore('assignment-999')).rejects.toThrow(
        'Failed to complete chore'
      );
    });
  });

  describe('uncompleteChore', () => {
    it('should mark chore as uncompleted and clear timestamp', async () => {
      const mockUpdatedAssignment: ChoreAssignment = {
        id: 'assignment-1',
        choreId: 'chore-1',
        userId: 'kid-1',
        assignedDate: new Date('2024-01-15'),
        completed: false,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.update.mockResolvedValue(mockUpdatedAssignment);

      const result = await service.uncompleteChore('assignment-1');

      expect(result).toEqual(mockUpdatedAssignment);
      expect(mockRepository.update).toHaveBeenCalledWith('assignment-1', {
        completed: false,
        completedAt: null,
      });
    });

    it('should throw error when update fails', async () => {
      mockRepository.update.mockRejectedValue(
        new Error('Assignment not found')
      );

      await expect(
        service.uncompleteChore('assignment-999')
      ).rejects.toThrow('Failed to uncomplete chore');
    });
  });

  describe('getAssignmentById', () => {
    it('should get assignment by id', async () => {
      const mockAssignment: ChoreAssignment = {
        id: 'assignment-1',
        choreId: 'chore-1',
        userId: 'kid-1',
        assignedDate: new Date('2024-01-15'),
        completed: false,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(mockAssignment);

      const result = await service.getAssignmentById('assignment-1');

      expect(result).toEqual(mockAssignment);
      expect(mockRepository.findById).toHaveBeenCalledWith('assignment-1');
    });

    it('should return null when assignment not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.getAssignmentById('assignment-999');

      expect(result).toBeNull();
    });

    it('should throw error on failure', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(
        service.getAssignmentById('assignment-1')
      ).rejects.toThrow('Failed to get assignment');
    });
  });
});
