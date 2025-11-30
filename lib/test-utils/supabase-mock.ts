/**
 * Mock Supabase client for testing
 */

export const createMockSupabaseClient = () => {
  const mockAuth = {
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
    verifyOtp: jest.fn(),
  };

  // Create chainable query builder mock
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(), // Make delete chainable
  };

  const mockFrom = jest.fn(() => mockQueryBuilder);

  const mockRpc = jest.fn();

  return {
    auth: mockAuth,
    from: mockFrom,
    rpc: mockRpc,
  };
};

export const mockSupabaseUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockKidUser = {
  id: '00000000-0000-0000-0000-000000000002',
  email: 'kid1@example.com',
  name: 'Alice Kid',
  role: 'kid',
};

export const mockParentUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'parent@example.com',
  name: 'John Parent',
  role: 'parent',
};
