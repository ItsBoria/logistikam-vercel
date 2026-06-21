import { c as createServerRpc } from "./createServerRpc-Cb-gMCu4.mjs";
import { a as createServerFn } from "./server-CIKTFqrt.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DIPMndrz.mjs";
import "../_libs/react.mjs";
import { s as stringType, o as objectType, n as numberType, b as booleanType, a as arrayType, e as enumType, r as recordType } from "../_libs/zod.mjs";
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
const listReplacementProducts_createServerFn_handler = createServerRpc({
  id: "09cb7d7ca4eee985fc5e272976dbf836fa9313305d2ccbdbc56b60816cd774ff",
  name: "listReplacementProducts",
  filename: "src/lib/replacement-admin.functions.ts"
}, (opts) => listReplacementProducts.__executeServer(opts));
const listReplacementProducts = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(listReplacementProducts_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data
  } = await supabaseAdmin.from("replacement_products").select("*").order("name");
  return Promise.all((data ?? []).map(async (p) => ({
    ...p,
    image_url: await resolveImage(supabaseAdmin, p.image_url),
    _raw_image_url: p.image_url
  })));
});
const imageUrlSchema = stringType().max(2e3).optional().nullable().refine((v) => !v || v.startsWith("http://") || v.startsWith("https://") || v.startsWith("storage:"), "כתובת תמונה לא תקינה");
const replacementProductSchema = objectType({
  id: stringType().uuid().optional(),
  name: stringType().min(1).max(200),
  description: stringType().max(2e3).optional().nullable(),
  category: stringType().max(100).optional().nullable(),
  image_url: imageUrlSchema,
  active: booleanType(),
  takin_stock: numberType().int().min(0).max(1e7),
  balai_stock: numberType().int().min(0).max(1e7)
});
const upsertReplacementProduct_createServerFn_handler = createServerRpc({
  id: "42b25249993e7703bc19024de873934aca1b5ef7e6d3acd5442557482e49be99",
  name: "upsertReplacementProduct",
  filename: "src/lib/replacement-admin.functions.ts"
}, (opts) => upsertReplacementProduct.__executeServer(opts));
const upsertReplacementProduct = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => replacementProductSchema.parse(input)).handler(upsertReplacementProduct_createServerFn_handler, async ({
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
    } = await supabaseAdmin.from("replacement_products").update(payload).eq("id", data.id);
    if (error) throw new Error(error.message);
  } else {
    const {
      error
    } = await supabaseAdmin.from("replacement_products").insert(payload);
    if (error) throw new Error(error.message);
  }
  return {
    ok: true
  };
});
const deleteReplacementProduct_createServerFn_handler = createServerRpc({
  id: "43b3991a1fa84994975b9db4ebb96be73f50f619893529b95c847271e0f7d89f",
  name: "deleteReplacementProduct",
  filename: "src/lib/replacement-admin.functions.ts"
}, (opts) => deleteReplacementProduct.__executeServer(opts));
const deleteReplacementProduct = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid()
}).parse(input)).handler(deleteReplacementProduct_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    error
  } = await supabaseAdmin.from("replacement_products").delete().eq("id", data.id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const adjustReplacementStock_createServerFn_handler = createServerRpc({
  id: "d39722ebf4e8d28ac540555c18345aea18f5416cd4caedfca91c4e8f624072a5",
  name: "adjustReplacementStock",
  filename: "src/lib/replacement-admin.functions.ts"
}, (opts) => adjustReplacementStock.__executeServer(opts));
const adjustReplacementStock = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid(),
  takin_delta: numberType().int().min(-1e6).max(1e6),
  balai_delta: numberType().int().min(-1e6).max(1e6)
}).parse(input)).handler(adjustReplacementStock_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: p
  } = await supabaseAdmin.from("replacement_products").select("takin_stock, balai_stock").eq("id", data.id).maybeSingle();
  if (!p) throw new Error("פריט לא נמצא");
  const newTakin = Math.max(0, p.takin_stock + data.takin_delta);
  const newBalai = Math.max(0, p.balai_stock + data.balai_delta);
  const {
    error
  } = await supabaseAdmin.from("replacement_products").update({
    takin_stock: newTakin,
    balai_stock: newBalai
  }).eq("id", data.id);
  if (error) throw new Error(error.message);
  return {
    ok: true,
    takin_stock: newTakin,
    balai_stock: newBalai
  };
});
const bulkImportReplacementProducts_createServerFn_handler = createServerRpc({
  id: "2bfafc2a26efd5840cf19a213937176fea015d3ec165a0fe639cc4ab40f92629",
  name: "bulkImportReplacementProducts",
  filename: "src/lib/replacement-admin.functions.ts"
}, (opts) => bulkImportReplacementProducts.__executeServer(opts));
const bulkImportReplacementProducts = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  rows: arrayType(objectType({
    name: stringType().min(1),
    description: stringType().optional().nullable(),
    category: stringType().optional().nullable(),
    image_url: stringType().optional().nullable(),
    takin_stock: numberType().int().min(0),
    balai_stock: numberType().int().min(0)
  })).min(1).max(2e3)
}).parse(input)).handler(bulkImportReplacementProducts_createServerFn_handler, async ({
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
    category: r.category ?? null,
    image_url: r.image_url || null,
    takin_stock: r.takin_stock,
    balai_stock: r.balai_stock,
    active: true
  }));
  const {
    error
  } = await supabaseAdmin.from("replacement_products").insert(payload);
  if (error) throw new Error(error.message);
  return {
    inserted: payload.length
  };
});
const listReplacementRequests_createServerFn_handler = createServerRpc({
  id: "9fd13b68f5978e003c48f7983aea6dff054e65f01f49ff418628f320ab3acfe3",
  name: "listReplacementRequests",
  filename: "src/lib/replacement-admin.functions.ts"
}, (opts) => listReplacementRequests.__executeServer(opts));
const listReplacementRequests = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  status: enumType(["preparing", "ready", "done", "cancelled"]).nullable().optional()
}).parse(input)).handler(listReplacementRequests_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  let q = supabaseAdmin.from("replacement_requests").select("*, teams(name), replacement_request_items(*)").order("created_at", {
    ascending: false
  });
  if (data.status) q = q.eq("status", data.status);
  const {
    data: rows,
    error
  } = await q;
  if (error) throw new Error(error.message);
  return rows ?? [];
});
const updateReplacementStatus_createServerFn_handler = createServerRpc({
  id: "a885eb9d070b1b6d8f31b2d974378fd99fd4d18256a1c6b703731814cb37a534",
  name: "updateReplacementStatus",
  filename: "src/lib/replacement-admin.functions.ts"
}, (opts) => updateReplacementStatus.__executeServer(opts));
const updateReplacementStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid(),
  action: enumType(["ready", "done", "cancel"]),
  // Only used when action === "done": per-item flag whether team returned broken unit (→ balai)
  return_balai: recordType(stringType().uuid(), booleanType()).optional()
}).parse(input)).handler(updateReplacementStatus_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: req
  } = await supabaseAdmin.from("replacement_requests").select("*, teams(id, name), replacement_request_items(*)").eq("id", data.id).single();
  if (!req) throw new Error("בקשה לא נמצאה");
  if (data.action === "ready") {
    if (req.status !== "preparing") throw new Error("ניתן לסמן 'מוכן לאיסוף' רק לבקשות בהכנה");
    const {
      error: error2
    } = await supabaseAdmin.from("replacement_requests").update({
      status: "ready"
    }).eq("id", data.id);
    if (error2) throw new Error(error2.message);
    try {
      const {
        sendPushToTeam
      } = await import("./push.server-De5oApd4.mjs");
      const teamId = req.team_id;
      await sendPushToTeam(teamId, {
        title: "בקשת ההחלפה מוכנה לאיסוף",
        body: "בקשת ההחלפה שלכם מוכנה לאיסוף ממחסן הציוד",
        url: "/shop/replacements"
      });
    } catch (e) {
      console.warn("[replacements] push failed", e);
    }
    return {
      ok: true
    };
  }
  if (data.action === "done") {
    if (req.status !== "ready" && req.status !== "preparing") throw new Error("הבקשה כבר נסגרה");
    for (const it of req.replacement_request_items) {
      if (!it.replacement_product_id) continue;
      const returned = data.return_balai?.[it.id] ?? true;
      if (!returned) continue;
      const {
        data: p
      } = await supabaseAdmin.from("replacement_products").select("balai_stock").eq("id", it.replacement_product_id).maybeSingle();
      if (!p) continue;
      await supabaseAdmin.from("replacement_products").update({
        balai_stock: p.balai_stock + it.quantity
      }).eq("id", it.replacement_product_id);
    }
    const {
      error: error2
    } = await supabaseAdmin.from("replacement_requests").update({
      status: "done",
      decided_at: (/* @__PURE__ */ new Date()).toISOString(),
      decided_by: context.userId
    }).eq("id", data.id);
    if (error2) throw new Error(error2.message);
    return {
      ok: true
    };
  }
  if (req.status === "done" || req.status === "cancelled") throw new Error("הבקשה כבר נסגרה");
  for (const it of req.replacement_request_items) {
    if (!it.replacement_product_id) continue;
    const {
      data: p
    } = await supabaseAdmin.from("replacement_products").select("takin_stock").eq("id", it.replacement_product_id).maybeSingle();
    if (!p) continue;
    await supabaseAdmin.from("replacement_products").update({
      takin_stock: p.takin_stock + it.quantity
    }).eq("id", it.replacement_product_id);
  }
  const {
    error
  } = await supabaseAdmin.from("replacement_requests").update({
    status: "cancelled",
    decided_at: (/* @__PURE__ */ new Date()).toISOString(),
    decided_by: context.userId
  }).eq("id", data.id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
export {
  adjustReplacementStock_createServerFn_handler,
  bulkImportReplacementProducts_createServerFn_handler,
  deleteReplacementProduct_createServerFn_handler,
  listReplacementProducts_createServerFn_handler,
  listReplacementRequests_createServerFn_handler,
  updateReplacementStatus_createServerFn_handler,
  upsertReplacementProduct_createServerFn_handler
};
