import { createClient } from "../_libs/supabase__supabase-js.mjs";
function createSupabaseClient() {
  const supabaseUrl = "https://example.supabase.co";
  const publishableKey = "build-validation-key";
  return createClient(supabaseUrl, publishableKey, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : void 0,
      persistSession: true,
      autoRefreshToken: true
    }
  });
}
let supabaseClient;
const supabase = new Proxy({}, {
  get(_, prop, receiver) {
    if (!supabaseClient) supabaseClient = createSupabaseClient();
    return Reflect.get(supabaseClient, prop, receiver);
  }
});
export {
  supabase as s
};
