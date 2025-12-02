/**
 * @jest-environment @edge-runtime/jest-environment
 */

import { GET, POST } from '../route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Chore Assignments API Routes', () => {
  let mockSupabase: any;
  let mockFrom: any;

  beforeEach(() => {
    // Setup mock query builder
    mockFrom = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn().mockReturnThis(),
    };

    // Setup mock Supabase client
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

  describe('GET /api/chore-assignments', () => {
    it('should return assignments for a specific date', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'parent-id',
            email: 'parent@example.com',
          },
        },
        error: null,
      });

      // First from() call for user profile lookup
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

      // Second from() call for chore assignments - needs .select().eq()
      const mockAssignmentsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
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
          ],
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockAssignmentsQuery);

      const url = new URL('http://localhost:3000/api/chore-assignments?date=2024-01-15');
      const request = {
        method: 'GET',
        nextUrl: url,
      } as any;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.assignments).toHaveLength(1);
      expect(data.assignments[0].choreId).toBe('chore-1');
    });

    it('should return assignments filtered by kidId', async () => {
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

      // Mock chained .eq() calls for date and kidId
      const secondEqMock = jest.fn().mockResolvedValue({
        data: [
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
        ],
        error: null,
      });

      const mockAssignmentsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          eq: secondEqMock,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockAssignmentsQuery);

      const url = new URL('http://localhost:3000/api/chore-assignments?date=2024-01-15&kidId=kid-1');
      const request = {
        method: 'GET',
        nextUrl: url,
      } as any;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.assignments).toHaveLength(1);
      expect(data.assignments[0].userId).toBe('kid-1');
    });

    it('should return 400 when date parameter is missing', async () => {
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

      mockSupabase.from.mockReturnValueOnce(mockUserQuery);

      const url = new URL('http://localhost:3000/api/chore-assignments');
      const request = {
        method: 'GET',
        nextUrl: url,
      } as any;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Date parameter is required');
    });

    it('should return 400 when date format is invalid', async () => {
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

      mockSupabase.from.mockReturnValueOnce(mockUserQuery);

      const url = new URL('http://localhost:3000/api/chore-assignments?date=invalid-date');
      const request = {
        method: 'GET',
        nextUrl: url,
      } as any;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid date format');
    });

    it('should return 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const url = new URL('http://localhost:3000/api/chore-assignments?date=2024-01-15');
      const request = {
        method: 'GET',
        nextUrl: url,
      } as any;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });
  });

  describe('POST /api/chore-assignments', () => {
    it('should create a new assignment (parent only)', async () => {
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

      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'new-assignment',
            chore_id: 'chore-1',
            user_id: 'kid-1',
            assigned_date: '2024-01-15',
            completed: false,
            completed_at: null,
            created_at: '2024-01-14T00:00:00Z',
            updated_at: '2024-01-14T00:00:00Z',
          },
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockInsertQuery);

      const request = new Request('http://localhost:3000/api/chore-assignments', {
        method: 'POST',
        body: JSON.stringify({
          choreId: 'chore-1',
          userId: 'kid-1',
          assignedDate: '2024-01-15',
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.assignment.choreId).toBe('chore-1');
      expect(data.assignment.userId).toBe('kid-1');
    });

    it('should return 403 when non-parent tries to assign chores', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'kid-id',
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
            id: 'kid-id',
            role: 'kid',
            email: 'kid@example.com',
            name: 'Kid',
          },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValueOnce(mockUserQuery);

      const request = new Request('http://localhost:3000/api/chore-assignments', {
        method: 'POST',
        body: JSON.stringify({
          choreId: 'chore-1',
          userId: 'kid-1',
          assignedDate: '2024-01-15',
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Only parents can assign chores');
    });

    it('should return 400 when required fields are missing', async () => {
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

      mockSupabase.from.mockReturnValueOnce(mockUserQuery);

      const request = new Request('http://localhost:3000/api/chore-assignments', {
        method: 'POST',
        body: JSON.stringify({
          choreId: 'chore-1',
          // Missing userId and assignedDate
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeTruthy();
    });

    it('should return 400 when date format is invalid', async () => {
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

      mockSupabase.from.mockReturnValueOnce(mockUserQuery);

      const request = new Request('http://localhost:3000/api/chore-assignments', {
        method: 'POST',
        body: JSON.stringify({
          choreId: 'chore-1',
          userId: 'kid-1',
          assignedDate: 'invalid-date',
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid date format');
    });

    it('should return 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new Request('http://localhost:3000/api/chore-assignments', {
        method: 'POST',
        body: JSON.stringify({
          choreId: 'chore-1',
          userId: 'kid-1',
          assignedDate: '2024-01-15',
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });
  });
});
