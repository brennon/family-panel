/**
 * @jest-environment @edge-runtime/jest-environment
 */

import { PATCH, DELETE } from '../route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Chores [id] API Routes', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('PATCH /api/chores/[id]', () => {
    it('should update chore when user is a parent', async () => {
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

      // First from() call for user profile lookup
      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'parent-id', role: 'parent', email: 'parent@example.com', name: 'Parent' },
          error: null,
        }),
      };

      // Second from() call for chore update
      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'chore-123',
            name: 'Updated chore',
            description: 'Updated description',
            monetary_value_cents: 1000,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockUpdateQuery);

      const request = new Request('http://localhost:3000/api/chores/chore-123', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated chore',
          description: 'Updated description',
          monetaryValueCents: 1000,
        }),
      });

      const response = await PATCH(request as any, { params: Promise.resolve({ id: 'chore-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.chore.name).toBe('Updated chore');
      expect(data.chore.monetaryValueCents).toBe(1000);
    });

    it('should return 403 when user is a kid', async () => {
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
          data: { id: 'kid-id', role: 'kid', email: 'kid@example.com', name: 'Kid' },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockUserQuery);

      const request = new Request('http://localhost:3000/api/chores/chore-123', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated' }),
      });

      const response = await PATCH(request as any, { params: Promise.resolve({ id: 'chore-123' }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only parents can update chores');
    });

    it('should return 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new Request('http://localhost:3000/api/chores/chore-123', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated' }),
      });

      const response = await PATCH(request as any, { params: Promise.resolve({ id: 'chore-123' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
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

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'parent-id', role: 'parent', email: 'parent@example.com', name: 'Parent' },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockUserQuery);

      const request = new Request('http://localhost:3000/api/chores/chore-123', {
        method: 'PATCH',
        body: JSON.stringify({
          monetaryValueCents: -50,
        }),
      });

      const response = await PATCH(request as any, { params: Promise.resolve({ id: 'chore-123' }) });
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

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'parent-id', role: 'parent', email: 'parent@example.com', name: 'Parent' },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockUserQuery);

      const request = new Request('http://localhost:3000/api/chores/chore-123', {
        method: 'PATCH',
        body: JSON.stringify({
          monetaryValueCents: 12.99,
        }),
      });

      const response = await PATCH(request as any, { params: Promise.resolve({ id: 'chore-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Monetary value must be an integer (cents)');
    });

    it('should return 500 when chore is not found', async () => {
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
          data: { id: 'parent-id', role: 'parent', email: 'parent@example.com', name: 'Parent' },
          error: null,
        }),
      };

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Row not found' },
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockUpdateQuery);

      const request = new Request('http://localhost:3000/api/chores/nonexistent-id', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated name',
        }),
      });

      const response = await PATCH(request as any, { params: Promise.resolve({ id: 'nonexistent-id' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update chore');
    });
  });

  describe('DELETE /api/chores/[id]', () => {
    it('should delete chore when user is a parent', async () => {
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
          data: { id: 'parent-id', role: 'parent', email: 'parent@example.com', name: 'Parent' },
          error: null,
        }),
      };

      // Second from() call for chore deletion
      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockDeleteQuery);

      const request = new Request('http://localhost:3000/api/chores/chore-123', {
        method: 'DELETE',
      });

      const response = await DELETE(request as any, { params: Promise.resolve({ id: 'chore-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 403 when user is a kid', async () => {
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
          data: { id: 'kid-id', role: 'kid', email: 'kid@example.com', name: 'Kid' },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockUserQuery);

      const request = new Request('http://localhost:3000/api/chores/chore-123', {
        method: 'DELETE',
      });

      const response = await DELETE(request as any, { params: Promise.resolve({ id: 'chore-123' }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only parents can delete chores');
    });

    it('should return 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new Request('http://localhost:3000/api/chores/chore-123', {
        method: 'DELETE',
      });

      const response = await DELETE(request as any, { params: Promise.resolve({ id: 'chore-123' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return 500 when chore is not found', async () => {
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
          data: { id: 'parent-id', role: 'parent', email: 'parent@example.com', name: 'Parent' },
          error: null,
        }),
      };

      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Row not found' },
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockDeleteQuery);

      const request = new Request('http://localhost:3000/api/chores/nonexistent-id', {
        method: 'DELETE',
      });

      const response = await DELETE(request as any, { params: Promise.resolve({ id: 'nonexistent-id' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete chore');
    });
  });
});
