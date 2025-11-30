/**
 * Tests for UserRepository
 * Repository layer handles data access and transforms between DB and domain types
 */

import { UserRepository } from '../user-repository';
import { createMockSupabaseClient } from '@/lib/test-utils/supabase-mock';
import type { User, CreateUserData, UpdateUserData } from '@/types';

describe('UserRepository', () => {
  let repository: UserRepository;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    repository = new UserRepository(mockSupabase as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockDbUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'parent',
        screen_time_daily_minutes: 120,
        pin_hash: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from().single.mockResolvedValue({
        data: mockDbUser,
        error: null,
      });

      const user = await repository.findById('123');

      expect(user).toEqual({
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'parent',
        screenTimeDailyMinutes: 120,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      });
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.from().select).toHaveBeenCalledWith('*');
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('id', '123');
    });

    it('should return null when user not found', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Row not found' } as any,
      });

      const user = await repository.findById('999');

      expect(user).toBeNull();
    });

    it('should throw error on database failure', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST500', message: 'Database error' } as any,
      });

      await expect(repository.findById('123')).rejects.toThrow(
        'Failed to find user'
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      const mockDbUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'kid',
        screen_time_daily_minutes: 60,
        pin_hash: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from().single.mockResolvedValue({
        data: mockDbUser,
        error: null,
      });

      const user = await repository.findByEmail('test@example.com');

      expect(user).toEqual({
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'kid',
        screenTimeDailyMinutes: 60,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      });
      expect(mockSupabase.from().eq).toHaveBeenCalledWith(
        'email',
        'test@example.com'
      );
    });

    it('should return null when user not found', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Row not found' } as any,
      });

      const user = await repository.findByEmail('notfound@example.com');

      expect(user).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockDbUsers = [
        {
          id: '1',
          email: 'parent@example.com',
          name: 'Parent',
          role: 'parent',
          screen_time_daily_minutes: 0,
          pin_hash: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          email: 'kid@example.com',
          name: 'Kid',
          role: 'kid',
          screen_time_daily_minutes: 60,
          pin_hash: 'hash',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      // Mock the chained query
      mockSupabase.from().select.mockResolvedValue({
        data: mockDbUsers,
        error: null,
      });

      const users = await repository.findAll();

      expect(users).toHaveLength(2);
      expect(users[0].role).toBe('parent');
      expect(users[1].role).toBe('kid');
    });

    it('should filter by role when provided', async () => {
      const mockDbUsers = [
        {
          id: '2',
          email: 'kid@example.com',
          name: 'Kid',
          role: 'kid',
          screen_time_daily_minutes: 60,
          pin_hash: 'hash',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      // Need to mock eq to also be chainable and resolve
      mockSupabase.from().eq.mockResolvedValue({
        data: mockDbUsers,
        error: null,
      });

      const users = await repository.findAll({ role: 'kid' });

      expect(users).toHaveLength(1);
      expect(users[0].role).toBe('kid');
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('role', 'kid');
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createData: CreateUserData = {
        email: 'new@example.com',
        name: 'New User',
        role: 'parent',
      };

      const mockDbUser = {
        id: 'new-id',
        email: 'new@example.com',
        name: 'New User',
        role: 'parent',
        screen_time_daily_minutes: 0,
        pin_hash: null,
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      };

      mockSupabase.from().single.mockResolvedValue({
        data: mockDbUser,
        error: null,
      });

      const user = await repository.create(createData);

      expect(user.id).toBe('new-id');
      expect(user.email).toBe('new@example.com');
      expect(user.name).toBe('New User');
      expect(user.role).toBe('parent');
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.from().insert).toHaveBeenCalled();
    });

    it('should use custom screen time when provided', async () => {
      const createData: CreateUserData = {
        email: 'kid@example.com',
        name: 'Kid User',
        role: 'kid',
        screenTimeDailyMinutes: 120,
      };

      const mockDbUser = {
        id: 'kid-id',
        email: 'kid@example.com',
        name: 'Kid User',
        role: 'kid',
        screen_time_daily_minutes: 120,
        pin_hash: null,
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      };

      mockSupabase.from().single.mockResolvedValue({
        data: mockDbUser,
        error: null,
      });

      const user = await repository.create(createData);

      expect(user.screenTimeDailyMinutes).toBe(120);
    });

    it('should throw error when creation fails', async () => {
      const createData: CreateUserData = {
        email: 'new@example.com',
        name: 'New User',
        role: 'parent',
      };

      mockSupabase.from().single.mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'Duplicate email' } as any,
      });

      await expect(repository.create(createData)).rejects.toThrow(
        'Failed to create user'
      );
    });
  });

  describe('update', () => {
    it('should update existing user', async () => {
      const updateData: UpdateUserData = {
        name: 'Updated Name',
        screenTimeDailyMinutes: 90,
      };

      const mockDbUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Updated Name',
        role: 'kid',
        screen_time_daily_minutes: 90,
        pin_hash: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      };

      mockSupabase.from().single.mockResolvedValue({
        data: mockDbUser,
        error: null,
      });

      const user = await repository.update('123', updateData);

      expect(user.name).toBe('Updated Name');
      expect(user.screenTimeDailyMinutes).toBe(90);
      expect(mockSupabase.from().update).toHaveBeenCalled();
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('id', '123');
    });

    it('should throw error when user not found', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Row not found' } as any,
      });

      await expect(
        repository.update('999', { name: 'New Name' })
      ).rejects.toThrow('Failed to update user');
    });
  });

  describe('delete', () => {
    it('should delete existing user', async () => {
      // eq() is called after delete(), so mock eq to resolve
      mockSupabase.from().eq.mockResolvedValue({
        data: null,
        error: null,
      });

      await repository.delete('123');

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.from().delete).toHaveBeenCalled();
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('id', '123');
    });

    it('should throw error when deletion fails', async () => {
      mockSupabase.from().eq.mockResolvedValue({
        data: null,
        error: { code: 'PGRST500', message: 'Database error' } as any,
      });

      await expect(repository.delete('123')).rejects.toThrow(
        'Failed to delete user'
      );
    });
  });
});
