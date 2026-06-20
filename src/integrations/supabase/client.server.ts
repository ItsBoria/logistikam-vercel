import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function createSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serverKey) {
    const missing = [
      ...(!supabaseUrl ? ["SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL"] : []),
      ...(!serverKey ? ["SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY"] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(", ")}. Configure the Supabase integration in Vercel.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(supabaseUrl, serverKey, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let supabaseAdminClient: ReturnType<typeof createSupabaseAdminClient> | undefined;

// SECURITY: This privileged client bypasses RLS. Import it only from server code.
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (!supabaseAdminClient) supabaseAdminClient = createSupabaseAdminClient();
    return Reflect.get(supabaseAdminClient, prop, receiver);
  },
});
