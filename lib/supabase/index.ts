/**
 * Supabase utilities barrel export
 */

export { createClient as createBrowserClient } from './client';
export { createClient as createServerClient, createAdminClient } from './server';
export type { Database, UserRole, RewardType } from './types';
