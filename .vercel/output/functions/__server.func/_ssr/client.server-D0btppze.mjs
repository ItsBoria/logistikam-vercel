import { createClient } from "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
function createSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serverKey) {
    const missing = [
      ...!supabaseUrl ? ["SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL"] : [],
      ...!serverKey ? ["SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY"] : []
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(", ")}. Configure the Supabase integration in Vercel.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }
  return createClient(supabaseUrl, serverKey, {
    auth: {
      storage: void 0,
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
let supabaseAdminClient;
const supabaseAdmin = new Proxy({}, {
  get(_, prop, receiver) {
    if (!supabaseAdminClient) supabaseAdminClient = createSupabaseAdminClient();
    return Reflect.get(supabaseAdminClient, prop, receiver);
  }
});
export {
  supabaseAdmin
};
