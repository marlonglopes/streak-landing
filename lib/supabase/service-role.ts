// Service-role Supabase client. BYPASSES RLS — use only from server-side
// contexts you trust (cron jobs, admin webhooks). Never import this from a
// Server Action or Server Component that renders user-influenced output.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL");
  }
  return createSupabaseClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
