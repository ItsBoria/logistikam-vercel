import { c as createServerRpc } from "./createServerRpc-Cb-gMCu4.mjs";
import { a as createServerFn } from "./server-CIKTFqrt.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DIPMndrz.mjs";
import "../_libs/react.mjs";
import { o as objectType, e as enumType, s as stringType, b as booleanType, n as numberType, a as arrayType } from "../_libs/zod.mjs";
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
const BUCKET = "product-images";
const SIGN_TTL = 60 * 60 * 24 * 7;
async function resolveImage(supabaseAdmin, url) {
  if (!url) return null;
  if (url.startsWith("storage:")) {
    const path = url.slice("storage:".length);
    const {
      data
    } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, SIGN_TTL);
    return data?.signedUrl ?? null;
  }
  return url;
}
async function assertAdmin(userId) {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("id").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("גישה לאדמין בלבד");
}
async function assertAdminOrStaff(userId) {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).in("role", ["admin", "staff"]);
  if (!data || data.length === 0) throw new Error("גישה מורשית בלבד");
}
async function maybeNotifyLowStock(supabaseAdmin, productId, prevStock) {
  try {
    const {
      data: prod
    } = await supabaseAdmin.from("products").select("id, name, stock, low_stock_threshold, active").eq("id", productId).maybeSingle();
    if (!prod || !prod.active) return;
    const {
      data: settingRow
    } = await supabaseAdmin.from("app_settings").select("value").eq("key", "default_low_stock_threshold").maybeSingle();
    const defaultThreshold = Number(settingRow?.value ?? 5);
    const threshold = prod.low_stock_threshold ?? defaultThreshold;
    if (prevStock > threshold && prod.stock <= threshold) {
      const {
        sendPushToAdmins
      } = await import("./admin-push.server-mZQCgZIh.mjs");
      await sendPushToAdmins("low_stock", {
        title: prod.stock === 0 ? "מוצר אזל מהמלאי" : "התראת מלאי נמוך",
        body: `${prod.name} — נשאר ${prod.stock} (סף ${threshold})`,
        url: "/admin/notifications"
      });
    }
  } catch (e) {
    console.warn("[low stock notify] failed:", e?.message);
  }
}
const listAdminUsers_createServerFn_handler = createServerRpc({
  id: "8b0453aaedcd8ffb3f94b29f9a5c0af1ac36e00b3de1fd5ea828663e9feaa15d",
  name: "listAdminUsers",
  filename: "src/lib/admin.functions.ts"
}, (opts) => listAdminUsers.__executeServer(opts));
const listAdminUsers = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(listAdminUsers_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: roles
  } = await supabaseAdmin.from("user_roles").select("user_id, role, created_at").in("role", ["admin", "staff"]);
  const {
    data: list
  } = await supabaseAdmin.auth.admin.listUsers();
  const userIds = Array.from(new Set((roles ?? []).map((r) => r.user_id)));
  const {
    data: profs
  } = userIds.length ? await supabaseAdmin.from("profiles").select("id, is_approver").in("id", userIds) : {
    data: []
  };
  const approverMap = new Map((profs ?? []).map((p) => [p.id, !!p.is_approver]));
  const byUser = /* @__PURE__ */ new Map();
  for (const r of roles ?? []) {
    const row = r;
    const cur = byUser.get(row.user_id) ?? {
      roles: [],
      created_at: row.created_at
    };
    cur.roles.push(row.role);
    if (new Date(row.created_at) < new Date(cur.created_at)) cur.created_at = row.created_at;
    byUser.set(row.user_id, cur);
  }
  return Array.from(byUser.entries()).map(([userId, info]) => {
    const u = list.users.find((x) => x.id === userId);
    return {
      user_id: userId,
      email: u?.email ?? "(לא ידוע)",
      username: u?.user_metadata?.username ?? null,
      roles: info.roles,
      is_admin: info.roles.includes("admin"),
      is_staff: info.roles.includes("staff"),
      is_approver: approverMap.get(userId) ?? false,
      created_at: info.created_at
    };
  });
});
const createAdminUser_createServerFn_handler = createServerRpc({
  id: "5b2fa8b9e283673ffda98e7e19731f1aece3f1d2453b8825510a0e996c39e023",
  name: "createAdminUser",
  filename: "src/lib/admin.functions.ts"
}, (opts) => createAdminUser.__executeServer(opts));
const createAdminUser = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  email: stringType().email(),
  username: stringType().min(2).max(40).regex(/^[a-zA-Z0-9_.-]+$/, "שם משתמש לא תקין"),
  password: stringType().min(8).max(72),
  role: enumType(["admin", "staff"]).default("admin")
}).parse(input)).handler(createAdminUser_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const usernameLower = data.username.trim().toLowerCase();
  const {
    data: list
  } = await supabaseAdmin.auth.admin.listUsers();
  const usernameTaken = list.users.find((u) => (u.user_metadata?.username || "").toString().toLowerCase() === usernameLower && u.email?.toLowerCase() !== data.email.toLowerCase());
  if (usernameTaken) throw new Error("שם המשתמש כבר תפוס");
  let userId = list.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase())?.id;
  if (!userId) {
    const {
      data: created,
      error
    } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        username: usernameLower
      }
    });
    if (error || !created.user) throw new Error(error?.message || "שגיאה ביצירת משתמש");
    userId = created.user.id;
  } else {
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: data.password,
      user_metadata: {
        username: usernameLower
      }
    });
  }
  await supabaseAdmin.from("user_roles").upsert({
    user_id: userId,
    role: data.role
  }, {
    onConflict: "user_id,role"
  });
  if (data.role === "admin") {
    const events = ["order_created", "order_awaiting_approval", "low_stock", "replacement_request"];
    await supabaseAdmin.from("admin_notification_prefs").upsert(events.map((e) => ({
      user_id: userId,
      event_type: e,
      enabled: true
    })), {
      onConflict: "user_id,event_type"
    });
  }
  return {
    ok: true
  };
});
const updateAdminUserRole_createServerFn_handler = createServerRpc({
  id: "caef67c2309bac25ed92a956b2bc3d0755225bda81ab667185aaa9bbe693fa36",
  name: "updateAdminUserRole",
  filename: "src/lib/admin.functions.ts"
}, (opts) => updateAdminUserRole.__executeServer(opts));
const updateAdminUserRole = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  user_id: stringType().uuid(),
  role: enumType(["admin", "staff", "customer"])
}).parse(input)).handler(updateAdminUserRole_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  if (data.user_id === context.userId && data.role !== "admin") {
    throw new Error("לא ניתן לשנות את התפקיד של עצמך");
  }
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id).in("role", ["admin", "staff"]);
  if (data.role === "customer") return {
    ok: true
  };
  const {
    error
  } = await supabaseAdmin.from("user_roles").insert({
    user_id: data.user_id,
    role: data.role
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const searchRegisteredUsers_createServerFn_handler = createServerRpc({
  id: "6ddf45e49abf16c46afaf8c918aa018d9cb0731c2a2b7a9deae17f51f4507faf",
  name: "searchRegisteredUsers",
  filename: "src/lib/admin.functions.ts"
}, (opts) => searchRegisteredUsers.__executeServer(opts));
const searchRegisteredUsers = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  query: stringType().max(200).optional().default("")
}).parse(input)).handler(searchRegisteredUsers_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: list
  } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 200
  });
  const {
    data: roles
  } = await supabaseAdmin.from("user_roles").select("user_id, role").in("role", ["admin", "staff"]);
  const roleByUser = /* @__PURE__ */ new Map();
  for (const r of roles ?? []) {
    const cur = roleByUser.get(r.user_id);
    if (r.role === "admin" || !cur) roleByUser.set(r.user_id, r.role);
  }
  const ids = list.users.map((u) => u.id);
  const safeIds = ids.length ? ids : ["00000000-0000-0000-0000-000000000000"];
  const {
    data: profs
  } = await supabaseAdmin.from("profiles").select("id, display_name").in("id", safeIds);
  const nameById = new Map((profs ?? []).map((p) => [p.id, p.display_name]));
  const {
    data: members
  } = await supabaseAdmin.from("team_members").select("user_id, team_id").in("user_id", safeIds);
  const teamIdByUser = new Map((members ?? []).map((m) => [m.user_id, m.team_id]));
  const teamIds = Array.from(new Set(Array.from(teamIdByUser.values())));
  const {
    data: teams
  } = teamIds.length ? await supabaseAdmin.from("teams").select("id, name").in("id", teamIds) : {
    data: []
  };
  const teamNameById = new Map((teams ?? []).map((t) => [t.id, t.name]));
  const q = data.query.trim().toLowerCase();
  const rows = list.users.map((u) => {
    const md = u.user_metadata || {};
    const displayName = nameById.get(u.id) || md.full_name || md.name || (u.email?.split("@")[0] ?? "");
    const provider = u.app_metadata?.provider || "email";
    const teamId = teamIdByUser.get(u.id) ?? null;
    return {
      id: u.id,
      email: u.email ?? "",
      displayName,
      provider,
      currentRole: roleByUser.get(u.id) ?? "customer",
      team_id: teamId,
      team_name: teamId ? teamNameById.get(teamId) ?? null : null,
      created_at: u.created_at
    };
  });
  const filtered = q ? rows.filter((r) => r.email.toLowerCase().includes(q) || r.displayName.toLowerCase().includes(q)) : rows;
  filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return filtered.slice(0, 50);
});
const deleteAdminUser_createServerFn_handler = createServerRpc({
  id: "71fa5d36fb064be3e1fa09a177b9f88400e4dc7e03003c59ff0bd89580fca2b5",
  name: "deleteAdminUser",
  filename: "src/lib/admin.functions.ts"
}, (opts) => deleteAdminUser.__executeServer(opts));
const deleteAdminUser = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  user_id: stringType().uuid()
}).parse(input)).handler(deleteAdminUser_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  if (data.user_id === context.userId) throw new Error("לא ניתן למחוק את עצמך");
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id).in("role", ["admin", "staff"]);
  await supabaseAdmin.auth.admin.deleteUser(data.user_id);
  return {
    ok: true
  };
});
const listTeams_createServerFn_handler = createServerRpc({
  id: "98a6d64f9cd5f7feec4f5390a1d88971764e2c1ebd2cafdf00e90316e614e42f",
  name: "listTeams",
  filename: "src/lib/admin.functions.ts"
}, (opts) => listTeams.__executeServer(opts));
const listTeams = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(listTeams_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: teams
  } = await supabaseAdmin.from("teams").select("*").order("created_at", {
    ascending: false
  });
  const withSpent = await Promise.all((teams ?? []).map(async (t) => {
    const {
      data: spent
    } = await supabaseAdmin.rpc("team_month_spent", {
      _team_id: t.id
    });
    return {
      ...t,
      monthly_spent: Number(spent ?? 0)
    };
  }));
  return withSpent;
});
const listTeamsBasic_createServerFn_handler = createServerRpc({
  id: "6a00edf67717aa0e703cd3028e6880e64e7ba5b03ec0ca04ea90b3d84922ac45",
  name: "listTeamsBasic",
  filename: "src/lib/admin.functions.ts"
}, (opts) => listTeamsBasic.__executeServer(opts));
const listTeamsBasic = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(listTeamsBasic_createServerFn_handler, async ({
  context
}) => {
  await assertAdminOrStaff(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data
  } = await supabaseAdmin.from("teams").select("id, name, active").order("name");
  return data ?? [];
});
const upsertTeam_createServerFn_handler = createServerRpc({
  id: "8ee812c7ed33945cdc3d2e846a278e2baca76b4116489796e6270d26acc4c36b",
  name: "upsertTeam",
  filename: "src/lib/admin.functions.ts"
}, (opts) => upsertTeam.__executeServer(opts));
const upsertTeam = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid().optional(),
  name: stringType().min(1).max(100),
  pin: stringType().min(4).max(20),
  monthly_limit: numberType().min(0).max(1e7),
  contact_phone: stringType().max(20).optional().nullable(),
  active: booleanType()
}).parse(input)).handler(upsertTeam_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  if (data.id) {
    const {
      error
    } = await supabaseAdmin.from("teams").update({
      name: data.name,
      pin: data.pin,
      monthly_limit: data.monthly_limit,
      contact_phone: data.contact_phone,
      active: data.active
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
  } else {
    const {
      error
    } = await supabaseAdmin.from("teams").insert({
      name: data.name,
      pin: data.pin,
      monthly_limit: data.monthly_limit,
      contact_phone: data.contact_phone,
      active: data.active
    });
    if (error) throw new Error(error.message);
  }
  return {
    ok: true
  };
});
const deleteTeam_createServerFn_handler = createServerRpc({
  id: "f4abb2f516d17413a27910aaa96a88f6d894953a022ba168d70621e59210c2bf",
  name: "deleteTeam",
  filename: "src/lib/admin.functions.ts"
}, (opts) => deleteTeam.__executeServer(opts));
const deleteTeam = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid()
}).parse(input)).handler(deleteTeam_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    error
  } = await supabaseAdmin.from("teams").delete().eq("id", data.id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const listProductsAdmin_createServerFn_handler = createServerRpc({
  id: "028985d334aec8d7cdc146c91902c6f16ea9c1031f7ddc27db0b3a16b17866f1",
  name: "listProductsAdmin",
  filename: "src/lib/admin.functions.ts"
}, (opts) => listProductsAdmin.__executeServer(opts));
const listProductsAdmin = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(listProductsAdmin_createServerFn_handler, async ({
  context
}) => {
  await assertAdminOrStaff(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data
  } = await supabaseAdmin.from("products").select("*").order("name");
  const resolved = await Promise.all((data ?? []).map(async (p) => ({
    ...p,
    image_url: await resolveImage(supabaseAdmin, p.image_url),
    _raw_image_url: p.image_url
    // for editing
  })));
  return resolved;
});
const updateProductStock_createServerFn_handler = createServerRpc({
  id: "698e7b644f2127657b17d7fa8cd0081a5e6244ae41cfa33c442d8ba74228d550",
  name: "updateProductStock",
  filename: "src/lib/admin.functions.ts"
}, (opts) => updateProductStock.__executeServer(opts));
const updateProductStock = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid(),
  stock: numberType().int().min(0).max(1e7),
  low_stock_threshold: numberType().int().min(0).max(1e7).nullable().optional()
}).parse(input)).handler(updateProductStock_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdminOrStaff(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: prev
  } = await supabaseAdmin.from("products").select("stock").eq("id", data.id).maybeSingle();
  if (!prev) throw new Error("מוצר לא נמצא");
  const update = {
    stock: data.stock
  };
  if (data.low_stock_threshold !== void 0) update.low_stock_threshold = data.low_stock_threshold;
  const {
    error
  } = await supabaseAdmin.from("products").update(update).eq("id", data.id);
  if (error) throw new Error(error.message);
  await maybeNotifyLowStock(supabaseAdmin, data.id, Number(prev.stock));
  return {
    ok: true
  };
});
const imageUrlSchema = stringType().max(2e3).optional().nullable().refine((v) => !v || v.startsWith("http://") || v.startsWith("https://") || v.startsWith("storage:"), "כתובת תמונה לא תקינה");
const productSchema = objectType({
  id: stringType().uuid().optional(),
  name: stringType().min(1).max(200),
  description: stringType().max(2e3).optional().nullable(),
  price: numberType().min(0).max(1e7),
  stock: numberType().int().min(0).max(1e7),
  category: stringType().max(100).optional().nullable(),
  image_url: imageUrlSchema,
  active: booleanType(),
  low_stock_threshold: numberType().int().min(0).max(1e7).nullable().optional()
});
const getAppSettings_createServerFn_handler = createServerRpc({
  id: "44b296f25bd32f8dd64469d70316ca9ea195e718bda2a1c95acfb24b639022f3",
  name: "getAppSettings",
  filename: "src/lib/admin.functions.ts"
}, (opts) => getAppSettings.__executeServer(opts));
const getAppSettings = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getAppSettings_createServerFn_handler, async ({
  context
}) => {
  await assertAdminOrStaff(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data
  } = await supabaseAdmin.from("app_settings").select("key, value");
  const map = {};
  for (const r of data ?? []) map[r.key] = r.value;
  return {
    default_low_stock_threshold: Number(map.default_low_stock_threshold ?? 5)
  };
});
const setDefaultLowStockThreshold_createServerFn_handler = createServerRpc({
  id: "8cb3f55fd5dfe2728a088a11da13ea94b6b895a05c01278d692ff7d3aeeb3ada",
  name: "setDefaultLowStockThreshold",
  filename: "src/lib/admin.functions.ts"
}, (opts) => setDefaultLowStockThreshold.__executeServer(opts));
const setDefaultLowStockThreshold = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  value: numberType().int().min(0).max(1e7)
}).parse(input)).handler(setDefaultLowStockThreshold_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    error
  } = await supabaseAdmin.from("app_settings").upsert({
    key: "default_low_stock_threshold",
    value: data.value,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const upsertProduct_createServerFn_handler = createServerRpc({
  id: "87057b699c92d5e9cc4f021e767a44009606525481c8a27886c5fc0375dc6625",
  name: "upsertProduct",
  filename: "src/lib/admin.functions.ts"
}, (opts) => upsertProduct.__executeServer(opts));
const upsertProduct = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => productSchema.parse(input)).handler(upsertProduct_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const payload = {
    ...data,
    image_url: data.image_url || null
  };
  if (data.id) {
    const {
      error
    } = await supabaseAdmin.from("products").update(payload).eq("id", data.id);
    if (error) throw new Error(error.message);
  } else {
    const {
      error
    } = await supabaseAdmin.from("products").insert(payload);
    if (error) throw new Error(error.message);
  }
  return {
    ok: true
  };
});
const uploadProductImage_createServerFn_handler = createServerRpc({
  id: "b1533cd6d84f2230b6fad65cfed09e4ce9425a1e77d301f3bbf8445b48ce7957",
  name: "uploadProductImage",
  filename: "src/lib/admin.functions.ts"
}, (opts) => uploadProductImage.__executeServer(opts));
const uploadProductImage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  filename: stringType().min(1).max(200),
  content_type: stringType().min(1).max(100),
  data_base64: stringType().min(1).max(15e6)
}).parse(input)).handler(uploadProductImage_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const ext = (data.filename.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${crypto.randomUUID()}.${ext}`;
  const bytes = Buffer.from(data.data_base64, "base64");
  const {
    error
  } = await supabaseAdmin.storage.from(BUCKET).upload(path, bytes, {
    contentType: data.content_type,
    upsert: false
  });
  if (error) throw new Error(error.message);
  const {
    data: signed
  } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, SIGN_TTL);
  return {
    storage_ref: `storage:${path}`,
    preview_url: signed?.signedUrl ?? null
  };
});
const deleteProduct_createServerFn_handler = createServerRpc({
  id: "d58e9647e4364d7098cb0d840b98a827719a64c5b316ad80080e28b97fb3f1cb",
  name: "deleteProduct",
  filename: "src/lib/admin.functions.ts"
}, (opts) => deleteProduct.__executeServer(opts));
const deleteProduct = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid()
}).parse(input)).handler(deleteProduct_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    error
  } = await supabaseAdmin.from("products").delete().eq("id", data.id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const bulkImportProducts_createServerFn_handler = createServerRpc({
  id: "8637ce4d3448bb944af09ee1021a2459ee5efdd45dd8d34dd382017d2a791ba0",
  name: "bulkImportProducts",
  filename: "src/lib/admin.functions.ts"
}, (opts) => bulkImportProducts.__executeServer(opts));
const bulkImportProducts = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  rows: arrayType(objectType({
    name: stringType().min(1),
    description: stringType().optional().nullable(),
    price: numberType().min(0),
    stock: numberType().int().min(0),
    category: stringType().optional().nullable(),
    image_url: stringType().optional().nullable()
  })).min(1).max(2e3)
}).parse(input)).handler(bulkImportProducts_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const payload = data.rows.map((r) => ({
    name: r.name,
    description: r.description ?? null,
    price: r.price,
    stock: r.stock,
    category: r.category ?? null,
    image_url: r.image_url || null,
    active: true
  }));
  const {
    error
  } = await supabaseAdmin.from("products").insert(payload);
  if (error) throw new Error(error.message);
  return {
    inserted: payload.length
  };
});
const listOrders_createServerFn_handler = createServerRpc({
  id: "417c9a43e3b2c8a52369c51aeba4e0a3cfd0fcc464e265d473e113f9511a245b",
  name: "listOrders",
  filename: "src/lib/admin.functions.ts"
}, (opts) => listOrders.__executeServer(opts));
const listOrders = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  team_id: stringType().uuid().nullable().optional(),
  status: stringType().nullable().optional(),
  from: stringType().nullable().optional(),
  to: stringType().nullable().optional(),
  search: stringType().max(200).nullable().optional()
}).parse(input)).handler(listOrders_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdminOrStaff(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  let q = supabaseAdmin.from("orders").select("*, teams(name), order_items(*)").order("created_at", {
    ascending: false
  });
  if (data.team_id) q = q.eq("team_id", data.team_id);
  if (data.status) q = q.eq("status", data.status);
  if (data.from) q = q.gte("created_at", data.from);
  if (data.to) q = q.lte("created_at", data.to);
  const {
    data: orders,
    error
  } = await q;
  if (error) throw new Error(error.message);
  let rows = orders ?? [];
  const search = (data.search ?? "").trim().toLowerCase();
  if (search) {
    rows = rows.filter((o) => {
      if (o.id.toLowerCase().startsWith(search)) return true;
      if ((o.teams?.name ?? "").toLowerCase().includes(search)) return true;
      if ((o.ordered_by_name ?? "").toLowerCase().includes(search)) return true;
      if ((o.contact_phone ?? "").toLowerCase().includes(search)) return true;
      if (o.order_items?.some((it) => (it.name ?? "").toLowerCase().includes(search))) return true;
      return false;
    });
  }
  return rows;
});
const getOrderDetail_createServerFn_handler = createServerRpc({
  id: "b8a39fcf137f82271ea7ed6209f080b5dbcd81cd0cb41de2802d816577ca7f78",
  name: "getOrderDetail",
  filename: "src/lib/admin.functions.ts"
}, (opts) => getOrderDetail.__executeServer(opts));
const getOrderDetail = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid()
}).parse(input)).handler(getOrderDetail_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdminOrStaff(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: order,
    error
  } = await supabaseAdmin.from("orders").select("*, teams(id, name, monthly_limit), order_items(*)").eq("id", data.id).single();
  if (error || !order) throw new Error(error?.message || "הזמנה לא נמצאה");
  const {
    data: history
  } = await supabaseAdmin.from("order_status_history").select("*").eq("order_id", data.id).order("created_at", {
    ascending: true
  });
  let monthSpent = 0;
  if (order.team_id) {
    const {
      data: spent
    } = await supabaseAdmin.rpc("team_month_spent", {
      _team_id: order.team_id
    });
    monthSpent = Number(spent ?? 0);
  }
  return {
    order,
    history: history ?? [],
    monthSpent
  };
});
const updateAdminNotes_createServerFn_handler = createServerRpc({
  id: "26b17d5eda570c8a30a5b5221ef756856bb2ec8f77ebf605d11e2dd87977ec05",
  name: "updateAdminNotes",
  filename: "src/lib/admin.functions.ts"
}, (opts) => updateAdminNotes.__executeServer(opts));
const updateAdminNotes = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid(),
  admin_notes: stringType().max(2e3).nullable()
}).parse(input)).handler(updateAdminNotes_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdminOrStaff(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    error
  } = await supabaseAdmin.from("orders").update({
    admin_notes: data.admin_notes
  }).eq("id", data.id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const updateOrderStatus_createServerFn_handler = createServerRpc({
  id: "573e69518e877f2ce18e3820832cb2cb45d1a897de1933c05de86f50fa9a7e10",
  name: "updateOrderStatus",
  filename: "src/lib/admin.functions.ts"
}, (opts) => updateOrderStatus.__executeServer(opts));
const updateOrderStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid(),
  status: enumType(["pending", "approved", "preparing", "ready", "completed", "cancelled", "awaiting_approval"])
}).parse(input)).handler(updateOrderStatus_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdminOrStaff(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: prev
  } = await supabaseAdmin.from("orders").select("*, order_items(*), teams(name)").eq("id", data.id).single();
  if (!prev) throw new Error("הזמנה לא נמצאה");
  if (prev.status === "awaiting_approval" && data.status !== "awaiting_approval" && data.status !== "cancelled") {
    for (const it of prev.order_items) {
      if (!it.product_id) continue;
      const {
        data: prod
      } = await supabaseAdmin.from("products").select("stock").eq("id", it.product_id).maybeSingle();
      if (prod) {
        await supabaseAdmin.from("products").update({
          stock: Math.max(0, prod.stock - it.quantity)
        }).eq("id", it.product_id);
        await maybeNotifyLowStock(supabaseAdmin, it.product_id, Number(prod.stock));
      }
    }
  }
  if (data.status === "cancelled" && prev.status !== "awaiting_approval" && prev.status !== "cancelled") {
    for (const it of prev.order_items) {
      if (!it.product_id) continue;
      const {
        data: prod
      } = await supabaseAdmin.from("products").select("stock").eq("id", it.product_id).maybeSingle();
      if (prod) await supabaseAdmin.from("products").update({
        stock: prod.stock + it.quantity
      }).eq("id", it.product_id);
    }
  }
  const {
    error
  } = await supabaseAdmin.from("orders").update({
    status: data.status
  }).eq("id", data.id);
  if (error) throw new Error(error.message);
  if (data.status === "ready") {
    const teamName = prev.teams?.name ?? "";
    const text = `ההזמנה של ${teamName} מוכנה לאיסוף. סה"כ: ₪${prev.total}`;
    if (prev.contact_phone) {
      const {
        sendSms
      } = await import("./sms.server-AcC0NvbV.mjs");
      await sendSms(prev.contact_phone, text).catch((e) => console.warn("[sms] failed:", e?.message));
    }
    const {
      sendPushToTeam
    } = await import("./push.server-De5oApd4.mjs");
    await sendPushToTeam(prev.team_id, {
      title: "ההזמנה מוכנה לאיסוף 🎉",
      body: text,
      url: "/shop/orders"
    }).catch((e) => console.warn("[push] failed:", e?.message));
  }
  return {
    ok: true
  };
});
const orderItemEditSchema = objectType({
  id: stringType().uuid().optional(),
  product_id: stringType().uuid().nullable().optional(),
  name: stringType().min(1).max(200),
  price: numberType().min(0).max(1e7),
  quantity: numberType().int().min(1).max(999)
});
const updateOrderItems_createServerFn_handler = createServerRpc({
  id: "9733ae8e477760272965b9be57e939d92f80057ec1a3b041dd5ba5702c84e92f",
  name: "updateOrderItems",
  filename: "src/lib/admin.functions.ts"
}, (opts) => updateOrderItems.__executeServer(opts));
const updateOrderItems = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  order_id: stringType().uuid(),
  items: arrayType(orderItemEditSchema).min(1).max(200),
  notes: stringType().max(500).optional().nullable()
}).parse(input)).handler(updateOrderItems_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdminOrStaff(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: prev
  } = await supabaseAdmin.from("orders").select("*, order_items(*)").eq("id", data.order_id).single();
  if (!prev) throw new Error("הזמנה לא נמצאה");
  const wasStockDeducted = prev.status !== "awaiting_approval" && prev.status !== "cancelled";
  if (wasStockDeducted) {
    for (const it of prev.order_items) {
      if (!it.product_id) continue;
      const {
        data: prod
      } = await supabaseAdmin.from("products").select("stock").eq("id", it.product_id).maybeSingle();
      if (prod) await supabaseAdmin.from("products").update({
        stock: prod.stock + it.quantity
      }).eq("id", it.product_id);
    }
  }
  await supabaseAdmin.from("order_items").delete().eq("order_id", data.order_id);
  let total = 0;
  const newItems = data.items.map((it) => {
    total += Number(it.price) * it.quantity;
    return {
      order_id: data.order_id,
      product_id: it.product_id ?? null,
      name: it.name,
      price: it.price,
      quantity: it.quantity
    };
  });
  const {
    error: insErr
  } = await supabaseAdmin.from("order_items").insert(newItems);
  if (insErr) throw new Error(insErr.message);
  if (wasStockDeducted) {
    for (const it of newItems) {
      if (!it.product_id) continue;
      const {
        data: prod
      } = await supabaseAdmin.from("products").select("stock").eq("id", it.product_id).maybeSingle();
      if (prod) {
        await supabaseAdmin.from("products").update({
          stock: Math.max(0, prod.stock - it.quantity)
        }).eq("id", it.product_id);
        await maybeNotifyLowStock(supabaseAdmin, it.product_id, Number(prod.stock));
      }
    }
  }
  const {
    error: updErr
  } = await supabaseAdmin.from("orders").update({
    total,
    notes: data.notes ?? prev.notes
  }).eq("id", data.order_id);
  if (updErr) throw new Error(updErr.message);
  return {
    ok: true,
    total
  };
});
const deleteOrder_createServerFn_handler = createServerRpc({
  id: "07850f6c9d8e9da3fa8132f60803ccc47e3a38d1f0458b109154e2f171bfdfa9",
  name: "deleteOrder",
  filename: "src/lib/admin.functions.ts"
}, (opts) => deleteOrder.__executeServer(opts));
const deleteOrder = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid()
}).parse(input)).handler(deleteOrder_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  await supabaseAdmin.from("order_items").delete().eq("order_id", data.id);
  const {
    error
  } = await supabaseAdmin.from("orders").delete().eq("id", data.id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const deleteOldOrders_createServerFn_handler = createServerRpc({
  id: "66c0768d6ba7b8f204c84a895184d6277f07fb21ec2d9bb4832920c3a991cc67",
  name: "deleteOldOrders",
  filename: "src/lib/admin.functions.ts"
}, (opts) => deleteOldOrders.__executeServer(opts));
const deleteOldOrders = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  before: stringType().min(1),
  only_completed: booleanType().optional()
}).parse(input)).handler(deleteOldOrders_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  let q = supabaseAdmin.from("orders").select("id").lt("created_at", data.before);
  if (data.only_completed) q = q.in("status", ["completed", "cancelled"]);
  const {
    data: rows,
    error
  } = await q;
  if (error) throw new Error(error.message);
  const ids = (rows ?? []).map((r) => r.id);
  if (!ids.length) return {
    deleted: 0
  };
  await supabaseAdmin.from("order_items").delete().in("order_id", ids);
  const {
    error: delErr
  } = await supabaseAdmin.from("orders").delete().in("id", ids);
  if (delErr) throw new Error(delErr.message);
  return {
    deleted: ids.length
  };
});
export {
  bulkImportProducts_createServerFn_handler,
  createAdminUser_createServerFn_handler,
  deleteAdminUser_createServerFn_handler,
  deleteOldOrders_createServerFn_handler,
  deleteOrder_createServerFn_handler,
  deleteProduct_createServerFn_handler,
  deleteTeam_createServerFn_handler,
  getAppSettings_createServerFn_handler,
  getOrderDetail_createServerFn_handler,
  listAdminUsers_createServerFn_handler,
  listOrders_createServerFn_handler,
  listProductsAdmin_createServerFn_handler,
  listTeamsBasic_createServerFn_handler,
  listTeams_createServerFn_handler,
  searchRegisteredUsers_createServerFn_handler,
  setDefaultLowStockThreshold_createServerFn_handler,
  updateAdminNotes_createServerFn_handler,
  updateAdminUserRole_createServerFn_handler,
  updateOrderItems_createServerFn_handler,
  updateOrderStatus_createServerFn_handler,
  updateProductStock_createServerFn_handler,
  uploadProductImage_createServerFn_handler,
  upsertProduct_createServerFn_handler,
  upsertTeam_createServerFn_handler
};
