// Supabase client initialization for Next.js PWA Monitoring & Notification System
// Provides both client and admin database clients

import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";

// Environment variables (must be set in .env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL environment variable is not set");
}

if (!supabaseAnonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is not set");
}

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set");
}

/**
 * Create a Supabase client with the anon key
 * Use this for client-side operations where Row Level Security (RLS) applies
 * 
 * @returns Supabase client instance
 */
export function createClient(): SupabaseClient {
  return createSupabaseClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      // For server-side operations, we don't need auth persistence
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Create a Supabase client with the service role key
 * Use this for admin operations that bypass RLS (e.g., creating nicknames, managing subscriptions)
 * WARNING: This client bypasses Row Level Security - use with caution
 * 
 * @returns Supabase client instance with elevated privileges
 */
export function createAdminClient(): SupabaseClient {
  return createSupabaseClient(supabaseUrl!, supabaseServiceRoleKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Singleton instances for reuse across requests
 * These are created once and reused to improve performance
 */
let clientInstance: SupabaseClient | null = null;
let adminClientInstance: SupabaseClient | null = null;

/**
 * Get or create the Supabase client instance
 * Uses singleton pattern for efficiency
 * 
 * @returns Supabase client instance
 */
export function getClient(): SupabaseClient {
  if (!clientInstance) {
    clientInstance = createClient();
  }
  return clientInstance;
}

/**
 * Get or create the Supabase admin client instance
 * Uses singleton pattern for efficiency
 * WARNING: This client bypasses Row Level Security
 * 
 * @returns Supabase admin client instance
 */
export function getAdminClient(): SupabaseClient {
  if (!adminClientInstance) {
    adminClientInstance = createAdminClient();
  }
  return adminClientInstance;
}

/**
 * Database utility functions for common operations
 */

/**
 * Test database connection
 * @returns true if connection is successful
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = getClient();
    const { error } = await client.from("nicknames").select("id").limit(1);
    return !error;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}