import { c as createServerRpc } from "./createServerRpc-Cb-gMCu4.mjs";
import { a as createServerFn } from "./server-CIKTFqrt.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DIPMndrz.mjs";
import "../_libs/react.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import "node:async_hooks";
import "node:stream";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "node:stream/web";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
const getMyTeamContext_createServerFn_handler = createServerRpc({
  id: "b24b8b91a1a579f7cfe0ed4f48e9904a54aee90205b29d6503d03f1f4347f885",
  name: "getMyTeamContext",
  filename: "src/lib/membership.functions.ts"
}, (opts) => getMyTeamContext.__executeServer(opts));
const getMyTeamContext = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getMyTeamContext_createServerFn_handler, async ({
  context
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: m
  } = await supabaseAdmin.from("team_members").select("team_id").eq("user_id", context.userId).maybeSingle();
  if (!m) return null;
  const {
    data: t
  } = await supabaseAdmin.from("teams").select("id, name, pin, monthly_limit, contact_phone, active").eq("id", m.team_id).maybeSingle();
  if (!t || !t.active) return null;
  return {
    team_id: t.id,
    team_name: t.name,
    pin: t.pin,
    monthly_limit: Number(t.monthly_limit),
    contact_phone: t.contact_phone
  };
});
const claimConfiguredFirstAdmin_createServerFn_handler = createServerRpc({
  id: "c5b7d1fb6c55001cebe88a38e82df96952bd76af54758368b5173f1c26c0d533",
  name: "claimConfiguredFirstAdmin",
  filename: "src/lib/membership.functions.ts"
}, (opts) => claimConfiguredFirstAdmin.__executeServer(opts));
const claimConfiguredFirstAdmin = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(claimConfiguredFirstAdmin_createServerFn_handler, async ({
  context
}) => {
  const configuredEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  if (!configuredEmail) return {
    claimed: false,
    reason: "not_configured"
  };
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: userData,
    error: userError
  } = await supabaseAdmin.auth.admin.getUserById(context.userId);
  if (userError || !userData.user) throw new Error(userError?.message || "Unable to load the signed-in user");
  if ((userData.user.email || "").toLowerCase() !== configuredEmail) {
    return {
      claimed: false,
      reason: "email_mismatch"
    };
  }
  const {
    count,
    error: countError
  } = await supabaseAdmin.from("user_roles").select("*", {
    count: "exact",
    head: true
  }).eq("role", "admin");
  if (countError) throw new Error(countError.message);
  if ((count ?? 0) > 0) return {
    claimed: false,
    reason: "admin_exists"
  };
  const {
    error: roleError
  } = await supabaseAdmin.from("user_roles").upsert({
    user_id: context.userId,
    role: "admin"
  }, {
    onConflict: "user_id,role"
  });
  if (roleError) throw new Error(roleError.message);
  return {
    claimed: true,
    reason: "claimed"
  };
});
const listActiveTeams_createServerFn_handler = createServerRpc({
  id: "c6045b6ce99d25d74b9e393062dbff9a534ada30433c762ae43cb190233dabe4",
  name: "listActiveTeams",
  filename: "src/lib/membership.functions.ts"
}, (opts) => listActiveTeams.__executeServer(opts));
const listActiveTeams = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(listActiveTeams_createServerFn_handler, async ({
  context
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: isAdmin
  } = await supabaseAdmin.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin"
  });
  let q = supabaseAdmin.from("teams").select("id, name, is_admin_only").eq("active", true).order("name");
  if (!isAdmin) q = q.eq("is_admin_only", false);
  const {
    data
  } = await q;
  return (data ?? []).map(({
    id,
    name
  }) => ({
    id,
    name
  }));
});
const setMyTeam_createServerFn_handler = createServerRpc({
  id: "8be22c3a55b67f70041649ad90564ad81cc4d1488a82fc88471e8be233497486",
  name: "setMyTeam",
  filename: "src/lib/membership.functions.ts"
}, (opts) => setMyTeam.__executeServer(opts));
const setMyTeam = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  team_id: stringType().uuid()
}).parse(input)).handler(setMyTeam_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: isAdmin
  } = await supabaseAdmin.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin"
  });
  const {
    data: existing
  } = await supabaseAdmin.from("team_members").select("team_id").eq("user_id", context.userId).maybeSingle();
  if (existing && !isAdmin) {
    throw new Error("הצוות שלך כבר נקבע — פנה למנהל לשינוי");
  }
  const {
    data: t
  } = await supabaseAdmin.from("teams").select("id, active, is_admin_only").eq("id", data.team_id).maybeSingle();
  if (!t || !t.active) throw new Error("צוות לא תקין");
  if (t.is_admin_only && !isAdmin) throw new Error("צוות לא תקין");
  const {
    error
  } = await supabaseAdmin.from("team_members").upsert({
    user_id: context.userId,
    team_id: data.team_id
  }, {
    onConflict: "user_id"
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const setUserTeamAdmin_createServerFn_handler = createServerRpc({
  id: "19ac49d55c90c51d9a1d50472ad9dd7ccf2cfc9a51d5172f0d2b246caa28f585",
  name: "setUserTeamAdmin",
  filename: "src/lib/membership.functions.ts"
}, (opts) => setUserTeamAdmin.__executeServer(opts));
const setUserTeamAdmin = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  user_id: stringType().uuid(),
  team_id: stringType().uuid().nullable()
}).parse(input)).handler(setUserTeamAdmin_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: isAdmin
  } = await supabaseAdmin.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin"
  });
  if (!isAdmin) throw new Error("גישה לאדמין בלבד");
  if (data.team_id === null) {
    const {
      error: error2
    } = await supabaseAdmin.from("team_members").delete().eq("user_id", data.user_id);
    if (error2) throw new Error(error2.message);
    return {
      ok: true
    };
  }
  const {
    data: t
  } = await supabaseAdmin.from("teams").select("id, active").eq("id", data.team_id).maybeSingle();
  if (!t || !t.active) throw new Error("צוות לא תקין");
  const {
    error
  } = await supabaseAdmin.from("team_members").upsert({
    user_id: data.user_id,
    team_id: data.team_id
  }, {
    onConflict: "user_id"
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const getTeamContextById_createServerFn_handler = createServerRpc({
  id: "a869b4edf640ed515d98ae440385e5d1840a4ba9ed1d2457ee84e5004da3df10",
  name: "getTeamContextById",
  filename: "src/lib/membership.functions.ts"
}, (opts) => getTeamContextById.__executeServer(opts));
const getTeamContextById = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  team_id: stringType().uuid()
}).parse(input)).handler(getTeamContextById_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: isAdmin
  } = await supabaseAdmin.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin"
  });
  if (!isAdmin) throw new Error("Forbidden");
  const {
    data: t
  } = await supabaseAdmin.from("teams").select("id, name, pin, monthly_limit, contact_phone, active").eq("id", data.team_id).maybeSingle();
  if (!t || !t.active) throw new Error("צוות לא תקין");
  return {
    team_id: t.id,
    team_name: t.name,
    pin: t.pin,
    monthly_limit: Number(t.monthly_limit),
    contact_phone: t.contact_phone
  };
});
const claimAdminWithLegacyCreds_createServerFn_handler = createServerRpc({
  id: "367acc39d5f680d07fdc62bbfe6fe067fb2261f76370713840a50c7843cd21eb",
  name: "claimAdminWithLegacyCreds",
  filename: "src/lib/membership.functions.ts"
}, (opts) => claimAdminWithLegacyCreds.__executeServer(opts));
const claimAdminWithLegacyCreds = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  identifier: stringType().min(2).max(254),
  password: stringType().min(1).max(72)
}).parse(input)).handler(claimAdminWithLegacyCreds_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    createClient
  } = await import("../_libs/supabase__supabase-js.mjs");
  const raw = data.identifier.trim().toLowerCase();
  const synth = raw.includes("@") ? raw : `${raw}@admins.local`;
  const candidates = [synth];
  const {
    data: list
  } = await supabaseAdmin.auth.admin.listUsers();
  const users = list?.users ?? [];
  const byMeta = users.find((u) => (u.user_metadata?.username || "").toString().toLowerCase() === raw);
  if (byMeta?.email) candidates.unshift(byMeta.email);
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_PUBLISHABLE_KEY;
  const tmp = createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  let legacyUserId = null;
  for (const email of candidates) {
    const {
      data: r,
      error
    } = await tmp.auth.signInWithPassword({
      email,
      password: data.password
    });
    if (!error && r.user) {
      legacyUserId = r.user.id;
      break;
    }
  }
  if (!legacyUserId) throw new Error("שם משתמש או סיסמה שגויים");
  const {
    data: isAdminLegacy
  } = await supabaseAdmin.rpc("has_role", {
    _user_id: legacyUserId,
    _role: "admin"
  });
  if (!isAdminLegacy) throw new Error("חשבון זה אינו מנהל");
  const {
    error: insErr
  } = await supabaseAdmin.from("user_roles").upsert({
    user_id: context.userId,
    role: "admin"
  }, {
    onConflict: "user_id,role"
  });
  if (insErr) throw new Error(insErr.message);
  return {
    ok: true
  };
});
export {
  claimAdminWithLegacyCreds_createServerFn_handler,
  claimConfiguredFirstAdmin_createServerFn_handler,
  getMyTeamContext_createServerFn_handler,
  getTeamContextById_createServerFn_handler,
  listActiveTeams_createServerFn_handler,
  setMyTeam_createServerFn_handler,
  setUserTeamAdmin_createServerFn_handler
};
