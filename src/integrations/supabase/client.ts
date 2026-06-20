import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function createSupabaseClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    const missing = [
      ...(!supabaseUrl ? ["VITE_SUPABASE_URL / SUPABASE_URL"] : []),
      ...(!publishableKey ? ["VITE_SUPABASE_PUBLISHABLE_KEY / SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(", ")}. Configure them in Vercel.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(supabaseUrl, publishableKey, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let supabaseClient: ReturnType<typeof createSupabaseClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!supabaseClient) supabaseClient = createSupabaseClient();
    return Reflect.get(supabaseClient, prop, receiver);
  },
});
