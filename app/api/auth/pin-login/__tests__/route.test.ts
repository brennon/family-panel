/**
 * @jest-environment @edge-runtime/jest-environment
 */

import { POST } from '../route';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
  createAdminClient: jest.fn(),
}));

describe('PIN Login API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject request without userId', async () => {
    const request = new Request('http://localhost:3000/api/auth/pin-login', {
      method: 'POST',
      body: JSON.stringify({ pin: '1234' }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('User ID and PIN are required');
  });

  it('should reject request without PIN', async () => {
    const request = new Request('http://localhost:3000/api/auth/pin-login', {
      method: 'POST',
      body: JSON.stringify({ userId: 'test-id' }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('User ID and PIN are required');
  });

  it('should reject non-4-digit PIN', async () => {
    const request = new Request('http://localhost:3000/api/auth/pin-login', {
      method: 'POST',
      body: JSON.stringify({ userId: 'test-id', pin: '123' }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('PIN must be 4 digits');
  });

  it('should reject invalid PIN', async () => {
    const mockAdminClient = {
      rpc: jest.fn().mockResolvedValue({ data: false, error: null }),
      from: jest.fn(),
    };

    (createAdminClient as jest.Mock).mockReturnValue(mockAdminClient);

    const request = new Request('http://localhost:3000/api/auth/pin-login', {
      method: 'POST',
      body: JSON.stringify({
        userId: '00000000-0000-0000-0000-000000000002',
        pin: '9999',
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid PIN or user ID');
  });

  it('should reject PIN login for non-kid users', async () => {
    const mockAdminClient = {
      rpc: jest.fn().mockResolvedValue({ data: true, error: null }),
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'parent@example.com',
            name: 'John Parent',
            role: 'parent',
          },
          error: null,
        }),
      })),
    };

    (createAdminClient as jest.Mock).mockReturnValue(mockAdminClient);

    const request = new Request('http://localhost:3000/api/auth/pin-login', {
      method: 'POST',
      body: JSON.stringify({
        userId: '00000000-0000-0000-0000-000000000001',
        pin: '1234',
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('PIN login is only for kids');
  });

  it('should generate magic link token for valid kid PIN', async () => {
    const mockAdminClient = {
      rpc: jest.fn().mockResolvedValue({ data: true, error: null }),
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: '00000000-0000-0000-0000-000000000002',
            email: 'kid1@example.com',
            name: 'Alice Kid',
            role: 'kid',
          },
          error: null,
        }),
      })),
      auth: {
        admin: {
          generateLink: jest.fn().mockResolvedValue({
            data: {
              properties: {
                action_link: 'http://localhost:3001/auth/confirm?token=mock-token-hash&type=magiclink',
                hashed_token: 'mock-token-hash',
              },
            },
            error: null,
          }),
        },
      },
    };

    (createAdminClient as jest.Mock).mockReturnValue(mockAdminClient);

    const request = new Request('http://localhost:3000/api/auth/pin-login', {
      method: 'POST',
      body: JSON.stringify({
        userId: '00000000-0000-0000-0000-000000000002',
        pin: '1234',
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.token).toBe('mock-token-hash');
    expect(data.user).toEqual({
      id: '00000000-0000-0000-0000-000000000002',
      email: 'kid1@example.com',
      name: 'Alice Kid',
      role: 'kid',
    });
    expect(mockAdminClient.auth.admin.generateLink).toHaveBeenCalledWith({
      type: 'magiclink',
      email: 'kid1@example.com',
    });
  });
});
