/**
 * Tests for ChoreService
 * Service layer handles business logic and orchestrates repository calls
 */

import { ChoreService } from '../chore-service';
import { ChoreRepository } from '@/lib/repositories';
import type { Chore, CreateChoreData, UpdateChoreData } from '@/types';

// Mock the repository
jest.mock('@/lib/repositories', () => {
  return {
    ChoreRepository: jest.fn(),
  };
});

describe('ChoreService', () => {
  let service: ChoreService;
  let mockRepository: jest.Mocked<ChoreRepository>;

  beforeEach(() => {
    // Create mock repository with all methods
    mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    service = new ChoreService(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getChoreById', () => {
    it('should return chore when found', async () => {
      const mockChore: Chore = {
        id: '123',
        name: 'Wash dishes',
        description: 'Clean all dishes',
        monetaryValueCents: 500,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockRepository.findById.mockResolvedValue(mockChore);

      const result = await service.getChoreById('123');

      expect(result).toEqual(mockChore);
      expect(mockRepository.findById).toHaveBeenCalledWith('123');
    });

    it('should return null when chore not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.getChoreById('999');

      expect(result).toBeNull();
    });

    it('should propagate repository errors', async () => {
      mockRepository.findById.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(service.getChoreById('123')).rejects.toThrow(
        'Failed to get chore 123'
      );
    });
  });

  describe('getAllChores', () => {
    it('should return all chores', async () => {
      const mockChores: Chore[] = [
        {
          id: '1',
          name: 'Wash dishes',
          description: null,
          monetaryValueCents: 500,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          name: 'Take out trash',
          description: 'Weekly trash duty',
          monetaryValueCents: 250,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockRepository.findAll.mockResolvedValue(mockChores);

      const result = await service.getAllChores();

      expect(result).toEqual(mockChores);
      expect(result).toHaveLength(2);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no chores exist', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      const result = await service.getAllChores();

      expect(result).toEqual([]);
    });
  });

  describe('createChore', () => {
    it('should create chore with all fields', async () => {
      const createData: CreateChoreData = {
        name: 'Vacuum floor',
        description: 'Vacuum all carpets',
        monetaryValueCents: 750,
      };

      const mockCreated: Chore = {
        id: 'new-id',
        name: 'Vacuum floor',
        description: 'Vacuum all carpets',
        monetaryValueCents: 750,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockResolvedValue(mockCreated);

      const result = await service.createChore(createData);

      expect(result).toEqual(mockCreated);
      expect(mockRepository.create).toHaveBeenCalledWith(createData);
    });

    it('should create chore with minimal fields', async () => {
      const createData: CreateChoreData = {
        name: 'Make bed',
      };

      const mockCreated: Chore = {
        id: 'new-id',
        name: 'Make bed',
        description: null,
        monetaryValueCents: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockResolvedValue(mockCreated);

      const result = await service.createChore(createData);

      expect(result.name).toBe('Make bed');
      expect(mockRepository.create).toHaveBeenCalledWith(createData);
    });

    it('should throw error when creation fails', async () => {
      const createData: CreateChoreData = {
        name: 'Test chore',
      };

      mockRepository.create.mockRejectedValue(
        new Error('Database constraint violation')
      );

      await expect(service.createChore(createData)).rejects.toThrow(
        'Failed to create chore'
      );
    });
  });

  describe('updateChore', () => {
    it('should update chore fields', async () => {
      const updateData: UpdateChoreData = {
        name: 'Updated name',
        monetaryValueCents: 1000,
      };

      const mockUpdated: Chore = {
        id: '123',
        name: 'Updated name',
        description: 'Original description',
        monetaryValueCents: 1000,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      };

      mockRepository.update.mockResolvedValue(mockUpdated);

      const result = await service.updateChore('123', updateData);

      expect(result).toEqual(mockUpdated);
      expect(mockRepository.update).toHaveBeenCalledWith('123', updateData);
    });

    it('should throw error when chore not found', async () => {
      mockRepository.update.mockRejectedValue(new Error('Chore not found'));

      await expect(
        service.updateChore('999', { name: 'New name' })
      ).rejects.toThrow('Failed to update chore 999');
    });
  });

  describe('deleteChore', () => {
    it('should delete chore successfully', async () => {
      mockRepository.delete.mockResolvedValue(undefined);

      await service.deleteChore('123');

      expect(mockRepository.delete).toHaveBeenCalledWith('123');
    });

    it('should throw error when deletion fails', async () => {
      mockRepository.delete.mockRejectedValue(
        new Error('Foreign key constraint')
      );

      await expect(service.deleteChore('123')).rejects.toThrow(
        'Failed to delete chore 123'
      );
    });
  });

  describe('business logic', () => {
    it('should enforce monetary value is in cents (integer)', async () => {
      const createData: CreateChoreData = {
        name: 'Test chore',
        monetaryValueCents: 525, // $5.25
      };

      const mockCreated: Chore = {
        id: 'new-id',
        name: 'Test chore',
        description: null,
        monetaryValueCents: 525,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockResolvedValue(mockCreated);

      const result = await service.createChore(createData);

      expect(result.monetaryValueCents).toBe(525);
      expect(Number.isInteger(result.monetaryValueCents)).toBe(true);
    });
  });
});
