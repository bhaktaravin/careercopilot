import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error("SUPABASE_URL is required");
if (!supabaseAnonKey) throw new Error("SUPABASE_ANON_KEY is required");
if (!supabaseServiceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");

export const anonClient = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: { persistSession: false },
});

export const db = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export function getSupabaseClient(_accessToken?: string) {
  return db;
}
