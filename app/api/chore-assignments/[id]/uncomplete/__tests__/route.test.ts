/**
 * @jest-environment @edge-runtime/jest-environment
 */

import { PATCH } from '../route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Uncomplete Chore Assignment API Route', () => {
  let mockSupabase: any;

  beforeEach(() => {
    const mockFrom = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      update: jest.fn().mockReturnThis(),
    };

    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => mockFrom),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('PATCH /api/chore-assignments/[id]/uncomplete', () => {
    it('should allow parent to uncomplete a chore', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'parent-id',
            email: 'parent@example.com',
          },
        },
        error: null,
      });

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'parent-id',
            role: 'parent',
            email: 'parent@example.com',
            name: 'Parent',
          },
          error: null,
        }),
      };

      const mockAssignmentQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'assignment-1',
            chore_id: 'chore-1',
            user_id: 'kid-1',
            assigned_date: '2024-01-15',
            completed: true,
            completed_at: '2024-01-15T10:30:00Z',
            created_at: '2024-01-14T00:00:00Z',
            updated_at: '2024-01-15T10:30:00Z',
          },
          error: null,
        }),
      };

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'assignment-1',
            chore_id: 'chore-1',
            user_id: 'kid-1',
            assigned_date: '2024-01-15',
            completed: false,
            completed_at: null,
            created_at: '2024-01-14T00:00:00Z',
            updated_at: '2024-01-15T11:00:00Z',
          },
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockAssignmentQuery)
        .mockReturnValueOnce(mockUpdateQuery);

      const params = Promise.resolve({ id: 'assignment-1' });
      const request = new Request(
        'http://localhost:3000/api/chore-assignments/assignment-1/uncomplete',
        {
          method: 'PATCH',
        }
      );

      const response = await PATCH(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.assignment.completed).toBe(false);
      expect(data.assignment.completedAt).toBeNull();
    });

    it('should return 403 when kid tries to uncomplete a chore', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'kid-1',
            email: 'kid@example.com',
          },
        },
        error: null,
      });

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'kid-1',
            role: 'kid',
            email: 'kid@example.com',
            name: 'Kid',
          },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValueOnce(mockUserQuery);

      const params = Promise.resolve({ id: 'assignment-1' });
      const request = new Request(
        'http://localhost:3000/api/chore-assignments/assignment-1/uncomplete',
        {
          method: 'PATCH',
        }
      );

      const response = await PATCH(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Only parents can uncomplete chores');
    });

    it('should return 404 when assignment does not exist', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'parent-id',
            email: 'parent@example.com',
          },
        },
        error: null,
      });

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'parent-id',
            role: 'parent',
            email: 'parent@example.com',
            name: 'Parent',
          },
          error: null,
        }),
      };

      const mockAssignmentQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Row not found' },
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockAssignmentQuery);

      const params = Promise.resolve({ id: 'nonexistent' });
      const request = new Request(
        'http://localhost:3000/api/chore-assignments/nonexistent/uncomplete',
        {
          method: 'PATCH',
        }
      );

      const response = await PATCH(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Assignment not found');
    });

    it('should return 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const params = Promise.resolve({ id: 'assignment-1' });
      const request = new Request(
        'http://localhost:3000/api/chore-assignments/assignment-1/uncomplete',
        {
          method: 'PATCH',
        }
      );

      const response = await PATCH(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });
  });
});
