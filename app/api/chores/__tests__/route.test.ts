/**
 * @jest-environment @edge-runtime/jest-environment
 */

import { GET, POST } from '../route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Chores API Routes', () => {
  let mockSupabase: any;
  let mockFrom: any;

  beforeEach(() => {
    // Setup mock query builder that supports chaining
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

  describe('GET /api/chores', () => {
    it('should return all chores for authenticated users', async () => {
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

      // First from() call for user profile lookup - needs .select().eq().single()
      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'parent-id', role: 'parent', email: 'parent@example.com', name: 'Parent' },
          error: null,
        }),
      };

      // Second from() call for chores - needs .select() only
      const mockChoresQuery = {
        select: jest.fn().mockResolvedValue({
          data: [
            {
              id: '1',
              name: 'Wash dishes',
              description: null,
              monetary_value_cents: 500,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          ],
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockChoresQuery);

      const request = new Request('http://localhost:3000/api/chores', {
        method: 'GET',
      });

      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.chores).toHaveLength(1);
      expect(data.chores[0].name).toBe('Wash dishes');
    });

    it('should return 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new Request('http://localhost:3000/api/chores', {
        method: 'GET',
      });

      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });
  });

  describe('POST /api/chores', () => {
    it('should create chore when user is a parent', async () => {
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

      // Mock user profile lookup (first call) and chore creation (second call)
      mockFrom.single
        .mockResolvedValueOnce({
          data: { id: 'parent-id', role: 'parent', email: 'parent@example.com', name: 'Parent' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: 'new-chore-id',
            name: 'Vacuum floor',
            description: 'Clean all carpets',
            monetary_value_cents: 750,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        });

      const request = new Request('http://localhost:3000/api/chores', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Vacuum floor',
          description: 'Clean all carpets',
          monetaryValueCents: 750,
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.chore.name).toBe('Vacuum floor');
      expect(data.chore.monetaryValueCents).toBe(750);
    });

    it('should return 403 when user is a kid', async () => {
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

      // Mock user profile lookup
      mockFrom.single.mockResolvedValue({
        data: { id: 'kid-id', role: 'kid', email: 'kid@example.com', name: 'Kid' },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/chores', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test chore',
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only parents can create chores');
    });

    it('should return 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new Request('http://localhost:3000/api/chores', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test chore',
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return 400 when name is missing', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'parent-id',
            email: 'parent@example.com',
          },
        },
        error: null,
      });

      mockFrom.single.mockResolvedValue({
        data: { id: 'parent-id', role: 'parent', email: 'parent@example.com', name: 'Parent' },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/chores', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Missing name',
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Chore name is required');
    });

    it('should return 400 when monetaryValueCents is negative', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'parent-id',
            email: 'parent@example.com',
          },
        },
        error: null,
      });

      mockFrom.single.mockResolvedValue({
        data: { id: 'parent-id', role: 'parent', email: 'parent@example.com', name: 'Parent' },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/chores', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test chore',
          monetaryValueCents: -100,
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Monetary value cannot be negative');
    });

    it('should return 400 when monetaryValueCents is not an integer', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'parent-id',
            email: 'parent@example.com',
          },
        },
        error: null,
      });

      mockFrom.single.mockResolvedValue({
        data: { id: 'parent-id', role: 'parent', email: 'parent@example.com', name: 'Parent' },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/chores', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test chore',
          monetaryValueCents: 5.50,
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Monetary value must be an integer (cents)');
    });
  });
});
