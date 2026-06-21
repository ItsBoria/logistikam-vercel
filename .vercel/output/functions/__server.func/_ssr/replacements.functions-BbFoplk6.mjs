import { c as createServerRpc } from "./createServerRpc-Cb-gMCu4.mjs";
import { a as createServerFn } from "./server-CIKTFqrt.mjs";
import "../_libs/react.mjs";
import { o as objectType, s as stringType, n as numberType, a as arrayType } from "../_libs/zod.mjs";
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
const getReplacementShop_createServerFn_handler = createServerRpc({
  id: "df247b03992b5b2a3e89e4f1c7a16aa27ba22dda9282f999694cf807ca1387ab",
  name: "getReplacementShop",
  filename: "src/lib/replacements.functions.ts"
}, (opts) => getReplacementShop.__executeServer(opts));
const getReplacementShop = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1).max(32)
}).parse(input)).handler(getReplacementShop_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: team
  } = await supabaseAdmin.from("teams").select("id, name, contact_phone").eq("pin", data.pin.trim()).eq("active", true).maybeSingle();
  if (!team) throw new Error("צוות לא תקין");
  const {
    data: products
  } = await supabaseAdmin.from("replacement_products").select("id, name, description, category, image_url, takin_stock").eq("active", true).gt("takin_stock", 0).order("name");
  const resolved = await Promise.all((products ?? []).map(async (p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
    image_url: await resolveImage(supabaseAdmin, p.image_url),
    available: true
    // mask exact count
  })));
  return {
    team,
    products: resolved
  };
});
const itemSchema = objectType({
  replacement_product_id: stringType().uuid(),
  quantity: numberType().int().min(1).max(99)
});
const submitReplacementRequest_createServerFn_handler = createServerRpc({
  id: "f9a48a7be1a5b474b90ed857ac045772fd1f511317cd2786af751fe4aa6f8334",
  name: "submitReplacementRequest",
  filename: "src/lib/replacements.functions.ts"
}, (opts) => submitReplacementRequest.__executeServer(opts));
const submitReplacementRequest = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1),
  items: arrayType(itemSchema).min(1).max(50),
  notes: stringType().max(500).optional(),
  contact_phone: stringType().min(7).max(20),
  ordered_by_name: stringType().min(1).max(100)
}).parse(input)).handler(submitReplacementRequest_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: team
  } = await supabaseAdmin.from("teams").select("id, active").eq("pin", data.pin.trim()).maybeSingle();
  if (!team || !team.active) throw new Error("צוות לא תקין");
  const ids = data.items.map((i) => i.replacement_product_id);
  const {
    data: products
  } = await supabaseAdmin.from("replacement_products").select("id, name, active, takin_stock").in("id", ids);
  if (!products || products.length !== ids.length) throw new Error("חלק מהפריטים לא נמצאו");
  const lines = data.items.map((i) => {
    const p = products.find((x) => x.id === i.replacement_product_id);
    if (!p.active) throw new Error(`הפריט ${p.name} אינו זמין`);
    if (p.takin_stock < i.quantity) throw new Error(`אין מספיק מלאי תקין עבור ${p.name}`);
    return {
      replacement_product_id: p.id,
      name: p.name,
      quantity: i.quantity,
      takin_stock: p.takin_stock
    };
  });
  const {
    data: req,
    error: reqErr
  } = await supabaseAdmin.from("replacement_requests").insert({
    team_id: team.id,
    status: "preparing",
    notes: data.notes,
    contact_phone: data.contact_phone,
    ordered_by_name: data.ordered_by_name
  }).select("id").single();
  if (reqErr || !req) throw new Error(reqErr?.message || "שגיאה ביצירת בקשה");
  const {
    error: itemsErr
  } = await supabaseAdmin.from("replacement_request_items").insert(lines.map((l) => ({
    replacement_product_id: l.replacement_product_id,
    name: l.name,
    quantity: l.quantity,
    request_id: req.id
  })));
  if (itemsErr) throw new Error(itemsErr.message);
  for (const l of lines) {
    await supabaseAdmin.from("replacement_products").update({
      takin_stock: Math.max(0, l.takin_stock - l.quantity)
    }).eq("id", l.replacement_product_id);
  }
  try {
    const {
      data: teamRow
    } = await supabaseAdmin.from("teams").select("name").eq("id", team.id).maybeSingle();
    const teamName = teamRow?.name ?? "צוות";
    const itemsLine = lines.map((l) => `${l.name}×${l.quantity}`).join(", ");
    const trimmed = itemsLine.length > 120 ? itemsLine.slice(0, 117) + "..." : itemsLine;
    const {
      sendPushToAdmins
    } = await import("./admin-push.server-mZQCgZIh.mjs");
    await sendPushToAdmins("replacement_request", {
      title: "בקשת החלפה חדשה",
      body: `${teamName} (${data.ordered_by_name}): ${trimmed}`,
      url: "/admin/replacements"
    });
  } catch (e) {
    console.warn("[admin notify replacement] failed:", e?.message);
  }
  return {
    request_id: req.id,
    status: "preparing"
  };
});
const getTeamReplacementRequests_createServerFn_handler = createServerRpc({
  id: "3327bb7f94bf0966f6d05e73ccc814940f57eb71e5967d026af4bd31a8770bd4",
  name: "getTeamReplacementRequests",
  filename: "src/lib/replacements.functions.ts"
}, (opts) => getTeamReplacementRequests.__executeServer(opts));
const getTeamReplacementRequests = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1)
}).parse(input)).handler(getTeamReplacementRequests_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: team
  } = await supabaseAdmin.from("teams").select("id, name").eq("pin", data.pin.trim()).eq("active", true).maybeSingle();
  if (!team) throw new Error("צוות לא תקין");
  const {
    data: requests,
    error
  } = await supabaseAdmin.from("replacement_requests").select("id, created_at, status, notes, ordered_by_name, contact_phone, replacement_request_items(id, replacement_product_id, name, quantity)").eq("team_id", team.id).order("created_at", {
    ascending: false
  }).limit(100);
  if (error) throw new Error(error.message);
  return {
    team,
    requests: requests ?? []
  };
});
async function loadOwnEditableRequest(supabaseAdmin, pin, request_id) {
  const {
    data: team
  } = await supabaseAdmin.from("teams").select("id, active").eq("pin", pin.trim()).maybeSingle();
  if (!team || !team.active) throw new Error("צוות לא תקין");
  const {
    data: req
  } = await supabaseAdmin.from("replacement_requests").select("id, team_id, status, replacement_request_items(id, replacement_product_id, name, quantity)").eq("id", request_id).maybeSingle();
  if (!req || req.team_id !== team.id) throw new Error("הבקשה לא נמצאה");
  if (req.status !== "preparing") throw new Error("לא ניתן לערוך בקשה זו");
  return {
    team,
    req
  };
}
async function restoreReplacementStock(supabaseAdmin, items) {
  for (const it of items) {
    if (!it.replacement_product_id) continue;
    const {
      data: p
    } = await supabaseAdmin.from("replacement_products").select("takin_stock").eq("id", it.replacement_product_id).maybeSingle();
    if (!p) continue;
    await supabaseAdmin.from("replacement_products").update({
      takin_stock: Number(p.takin_stock) + Number(it.quantity)
    }).eq("id", it.replacement_product_id);
  }
}
const deleteReplacementRequest_createServerFn_handler = createServerRpc({
  id: "5c47c6298a5d9abd0b8eb583a64edaa59b11383078e9cb0b36cd95b95df7d75c",
  name: "deleteReplacementRequest",
  filename: "src/lib/replacements.functions.ts"
}, (opts) => deleteReplacementRequest.__executeServer(opts));
const deleteReplacementRequest = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1),
  request_id: stringType().uuid()
}).parse(input)).handler(deleteReplacementRequest_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    req
  } = await loadOwnEditableRequest(supabaseAdmin, data.pin, data.request_id);
  await restoreReplacementStock(supabaseAdmin, req.replacement_request_items);
  await supabaseAdmin.from("replacement_request_items").delete().eq("request_id", req.id);
  const {
    error
  } = await supabaseAdmin.from("replacement_requests").delete().eq("id", req.id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const editReplacementRequest_createServerFn_handler = createServerRpc({
  id: "5c9b561d3e82d4d48ca1aa9e6ac64400ffbd51aabf97315f427ae58bf5f38f55",
  name: "editReplacementRequest",
  filename: "src/lib/replacements.functions.ts"
}, (opts) => editReplacementRequest.__executeServer(opts));
const editReplacementRequest = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1),
  request_id: stringType().uuid(),
  items: arrayType(itemSchema).min(1).max(50),
  notes: stringType().max(500).optional(),
  contact_phone: stringType().min(7).max(20).optional(),
  ordered_by_name: stringType().min(1).max(100).optional()
}).parse(input)).handler(editReplacementRequest_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    req
  } = await loadOwnEditableRequest(supabaseAdmin, data.pin, data.request_id);
  await restoreReplacementStock(supabaseAdmin, req.replacement_request_items);
  const ids = data.items.map((i) => i.replacement_product_id);
  const {
    data: products
  } = await supabaseAdmin.from("replacement_products").select("id, name, active, takin_stock").in("id", ids);
  if (!products || products.length !== ids.length) throw new Error("חלק מהפריטים לא נמצאו");
  const lines = data.items.map((i) => {
    const p = products.find((x) => x.id === i.replacement_product_id);
    if (!p.active) throw new Error(`הפריט ${p.name} אינו זמין`);
    if (Number(p.takin_stock) < i.quantity) throw new Error(`אין מספיק מלאי תקין עבור ${p.name}`);
    return {
      replacement_product_id: p.id,
      name: p.name,
      quantity: i.quantity,
      takin_stock: Number(p.takin_stock)
    };
  });
  await supabaseAdmin.from("replacement_request_items").delete().eq("request_id", req.id);
  const {
    error: insErr
  } = await supabaseAdmin.from("replacement_request_items").insert(lines.map((l) => ({
    replacement_product_id: l.replacement_product_id,
    name: l.name,
    quantity: l.quantity,
    request_id: req.id
  })));
  if (insErr) throw new Error(insErr.message);
  const updateFields = {};
  if (data.notes !== void 0) updateFields.notes = data.notes;
  if (data.contact_phone !== void 0) updateFields.contact_phone = data.contact_phone;
  if (data.ordered_by_name !== void 0) updateFields.ordered_by_name = data.ordered_by_name;
  if (Object.keys(updateFields).length > 0) {
    const {
      error: updErr
    } = await supabaseAdmin.from("replacement_requests").update(updateFields).eq("id", req.id);
    if (updErr) throw new Error(updErr.message);
  }
  for (const l of lines) {
    await supabaseAdmin.from("replacement_products").update({
      takin_stock: Math.max(0, l.takin_stock - l.quantity)
    }).eq("id", l.replacement_product_id);
  }
  return {
    ok: true
  };
});
export {
  deleteReplacementRequest_createServerFn_handler,
  editReplacementRequest_createServerFn_handler,
  getReplacementShop_createServerFn_handler,
  getTeamReplacementRequests_createServerFn_handler,
  submitReplacementRequest_createServerFn_handler
};
