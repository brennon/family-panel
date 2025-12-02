/**
 * @jest-environment @edge-runtime/jest-environment
 */

/**
 * Unit tests for GET /api/users/kids
 * Tests fetching kids list (parent-only endpoint)
 */

import { GET } from '../route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('GET /api/users/kids', () => {
  let mockSupabase: any;
  let mockFrom: any;
  let mockQuery: any;

  beforeEach(() => {
    // Setup mock query builder that can be both chained and awaited
    mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      then: jest.fn(), // Makes it awaitable
    };

    mockFrom = jest.fn(() => mockQuery);

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: mockFrom,
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new Request('http://localhost:3000/api/users/kids');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty('error');
    });

    it('should return 403 if user is not a parent', async () => {
      // Mock authenticated kid user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'kid-id',
            email: 'kid@example.com',
          },
        },
        error: null,
      });

      // Mock user lookup returning kid role
      mockQuery.single.mockResolvedValue({
        data: {
          id: 'kid-id',
          email: 'kid@example.com',
          name: 'Kid User',
          role: 'kid',
          screen_time_daily_minutes: 120,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/users/kids');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({ error: 'Only parents can view kids list' });
    });
  });

  describe('Successful requests', () => {
    const mockUserLookup = {
      id: 'parent-id',
      email: 'parent@example.com',
      name: 'Parent User',
      role: 'parent',
      screen_time_daily_minutes: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    beforeEach(() => {
      // Mock authenticated parent user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'parent-id',
            email: 'parent@example.com',
          },
        },
        error: null,
      });

      // Mock parent user profile lookup (first query uses .single())
      mockQuery.single.mockResolvedValueOnce({
        data: mockUserLookup,
        error: null,
      });
    });

    it('should return list of kids when parent is authenticated', async () => {
      const mockKids = [
        {
          id: 'kid-1',
          email: 'kid1@example.com',
          name: 'Kid One',
          role: 'kid',
          screen_time_daily_minutes: 120,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'kid-2',
          email: 'kid2@example.com',
          name: 'Kid Two',
          role: 'kid',
          screen_time_daily_minutes: 90,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // Mock second query to get kids (awaited directly, no .single())
      mockQuery.then.mockImplementationOnce((resolve) => {
        resolve({ data: mockKids, error: null });
        return Promise.resolve({ data: mockKids, error: null });
      });

      const request = new Request('http://localhost:3000/api/users/kids');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('kids');
      expect(Array.isArray(data.kids)).toBe(true);
      expect(data.kids).toHaveLength(2);
    });

    it('should return empty array when no kids exist', async () => {
      // Mock second query to get kids (empty)
      mockQuery.then.mockImplementationOnce((resolve) => {
        resolve({ data: [], error: null });
        return Promise.resolve({ data: [], error: null });
      });

      const request = new Request('http://localhost:3000/api/users/kids');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.kids).toEqual([]);
    });
  });

  describe('Error handling', () => {
    it('should return 500 if database query fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'parent-id',
            email: 'parent@example.com',
          },
        },
        error: null,
      });

      mockQuery.single.mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost:3000/api/users/kids');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch kids' });
    });
  });
});
