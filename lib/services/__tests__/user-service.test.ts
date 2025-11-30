/**
 * Tests for UserService
 * Service layer contains business logic and orchestrates repository operations
 */

import { UserService } from '../user-service';
import { UserRepository } from '@/lib/repositories';
import type { User, CreateUserData, UpdateUserData } from '@/types';

// Mock the repository
jest.mock('@/lib/repositories');

describe('UserService', () => {
  let service: UserService;
  let mockRepository: jest.Mocked<UserRepository>;

  const mockUser: User = {
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'parent',
    screenTimeDailyMinutes: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    service = new UserService(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);

      const user = await service.getUserById('123');

      expect(user).toEqual(mockUser);
      expect(mockRepository.findById).toHaveBeenCalledWith('123');
    });

    it('should return null when user not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const user = await service.getUserById('999');

      expect(user).toBeNull();
    });

    it('should throw error with user ID in message', async () => {
      mockRepository.findById.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(service.getUserById('123')).rejects.toThrow(
        'Failed to get user 123'
      );
    });
  });

  describe('getUserByEmail', () => {
    it('should return user when found', async () => {
      mockRepository.findByEmail.mockResolvedValue(mockUser);

      const user = await service.getUserByEmail('test@example.com');

      expect(user).toEqual(mockUser);
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
    });

    it('should normalize email to lowercase', async () => {
      mockRepository.findByEmail.mockResolvedValue(mockUser);

      await service.getUserByEmail('TEST@EXAMPLE.COM');

      expect(mockRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const users = [mockUser];
      mockRepository.findAll.mockResolvedValue(users);

      const result = await service.getAllUsers();

      expect(result).toEqual(users);
      expect(mockRepository.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should pass filters to repository', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      await service.getAllUsers({ role: 'kid' });

      expect(mockRepository.findAll).toHaveBeenCalledWith({ role: 'kid' });
    });
  });

  describe('getKids', () => {
    it('should return only users with kid role', async () => {
      const kidUser: User = { ...mockUser, role: 'kid' };
      mockRepository.findAll.mockResolvedValue([kidUser]);

      const kids = await service.getKids();

      expect(kids).toEqual([kidUser]);
      expect(mockRepository.findAll).toHaveBeenCalledWith({ role: 'kid' });
    });
  });

  describe('getParents', () => {
    it('should return only users with parent role', async () => {
      mockRepository.findAll.mockResolvedValue([mockUser]);

      const parents = await service.getParents();

      expect(parents).toEqual([mockUser]);
      expect(mockRepository.findAll).toHaveBeenCalledWith({ role: 'parent' });
    });
  });

  describe('createUser', () => {
    it('should create user with provided data', async () => {
      const createData: CreateUserData = {
        email: 'new@example.com',
        name: 'New User',
        role: 'parent',
      };

      const createdUser: User = {
        ...mockUser,
        email: 'new@example.com',
        name: 'New User',
      };

      mockRepository.create.mockResolvedValue(createdUser);

      const user = await service.createUser(createData);

      expect(user).toEqual(createdUser);
      expect(mockRepository.create).toHaveBeenCalledWith(createData);
    });

    it('should normalize email to lowercase before creating', async () => {
      const createData: CreateUserData = {
        email: 'NEW@EXAMPLE.COM',
        name: 'New User',
        role: 'parent',
      };

      mockRepository.create.mockResolvedValue(mockUser);

      await service.createUser(createData);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createData,
        email: 'new@example.com',
      });
    });

    it('should throw error if email already exists', async () => {
      const createData: CreateUserData = {
        email: 'existing@example.com',
        name: 'User',
        role: 'parent',
      };

      mockRepository.create.mockRejectedValue(
        new Error('Failed to create user: duplicate key value')
      );

      await expect(service.createUser(createData)).rejects.toThrow(
        'Failed to create user'
      );
    });
  });

  describe('updateUser', () => {
    it('should update user with provided data', async () => {
      const updateData: UpdateUserData = {
        name: 'Updated Name',
      };

      const updatedUser: User = {
        ...mockUser,
        name: 'Updated Name',
        updatedAt: new Date('2024-01-02'),
      };

      mockRepository.update.mockResolvedValue(updatedUser);

      const user = await service.updateUser('123', updateData);

      expect(user).toEqual(updatedUser);
      expect(mockRepository.update).toHaveBeenCalledWith('123', updateData);
    });

    it('should normalize email to lowercase if provided', async () => {
      const updateData: UpdateUserData = {
        email: 'UPDATED@EXAMPLE.COM',
      };

      mockRepository.update.mockResolvedValue(mockUser);

      await service.updateUser('123', updateData);

      expect(mockRepository.update).toHaveBeenCalledWith('123', {
        email: 'updated@example.com',
      });
    });

    it('should throw error if user not found', async () => {
      mockRepository.update.mockRejectedValue(
        new Error('Failed to update user: Row not found')
      );

      await expect(
        service.updateUser('999', { name: 'New Name' })
      ).rejects.toThrow('Failed to update user 999');
    });
  });

  describe('deleteUser', () => {
    it('should delete user by ID', async () => {
      mockRepository.delete.mockResolvedValue(undefined);

      await service.deleteUser('123');

      expect(mockRepository.delete).toHaveBeenCalledWith('123');
    });

    it('should throw error if deletion fails', async () => {
      mockRepository.delete.mockRejectedValue(
        new Error('Database error')
      );

      await expect(service.deleteUser('123')).rejects.toThrow(
        'Failed to delete user 123'
      );
    });
  });

  describe('updateScreenTime', () => {
    it('should update only screen time field', async () => {
      const updatedUser: User = {
        ...mockUser,
        screenTimeDailyMinutes: 120,
      };

      mockRepository.update.mockResolvedValue(updatedUser);

      const user = await service.updateScreenTime('123', 120);

      expect(user.screenTimeDailyMinutes).toBe(120);
      expect(mockRepository.update).toHaveBeenCalledWith('123', {
        screenTimeDailyMinutes: 120,
      });
    });

    it('should throw error for negative screen time', async () => {
      await expect(service.updateScreenTime('123', -10)).rejects.toThrow(
        'Screen time must be a positive number'
      );

      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });
});
