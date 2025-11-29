/**
 * Supabase client for browser/client-side operations
 * Uses the anon key with RLS policies enforced
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createClient() {
  // Skip client creation during build time when env vars aren't available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Return a dummy client that won't be used during build
    // This is safe because the AuthProvider is a client component that only runs in the browser
    return createBrowserClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-anon-key',
      {
        cookies: {
          get() { return undefined; },
          set() { },
          remove() { },
        },
      }
    );
  }

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Skip if not in browser (SSR/build time)
          if (typeof document === 'undefined') return undefined;

          // Get cookie from document.cookie
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          // Skip if not in browser (SSR/build time)
          if (typeof document === 'undefined') return;

          // Set cookie on document.cookie
          let cookie = `${name}=${value}`;
          if (options.maxAge) cookie += `; max-age=${options.maxAge}`;
          if (options.path) cookie += `; path=${options.path}`;
          if (options.sameSite) cookie += `; samesite=${options.sameSite}`;
          if (options.secure) cookie += '; secure';
          document.cookie = cookie;
        },
        remove(name: string, options: Record<string, unknown>) {
          // Skip if not in browser (SSR/build time)
          if (typeof document === 'undefined') return;

          // Remove cookie by setting max-age to 0
          let cookie = `${name}=; max-age=0`;
          if (options.path) cookie += `; path=${options.path}`;
          document.cookie = cookie;
        },
      },
    }
  );
}
