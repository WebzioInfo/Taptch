/**
 * Supabase Client & Server Integration
 * Provides isomorphic helpers for Supabase operations, storage, and SSR.
 */

export { createClient as createBrowserClient } from '@/utils/supabase/client';
export { createClient as createServerClient } from '@/utils/supabase/server';
export { createClient as createMiddlewareClient } from '@/utils/supabase/middleware';
