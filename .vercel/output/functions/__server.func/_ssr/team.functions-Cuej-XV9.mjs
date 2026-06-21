import { c as createServerRpc } from "./createServerRpc-Cb-gMCu4.mjs";
import { a as createServerFn } from "./server-CIKTFqrt.mjs";
import { a as addVat } from "./pricing-DW2SFuan.mjs";
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
async function resolveProductImages(supabaseAdmin, products) {
  return Promise.all(products.map(async (p) => ({
    ...p,
    image_url: await resolveImage(supabaseAdmin, p.image_url)
  })));
}
const verifyTeamPin_createServerFn_handler = createServerRpc({
  id: "8430ad8e0a8504020e1b302c68aa3dc9438e05adfe9e7c23dbcd58ac4d020052",
  name: "verifyTeamPin",
  filename: "src/lib/team.functions.ts"
}, (opts) => verifyTeamPin.__executeServer(opts));
const verifyTeamPin = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1).max(32)
}).parse(input)).handler(verifyTeamPin_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: team,
    error
  } = await supabaseAdmin.from("teams").select("id, name, monthly_limit, active, contact_phone").eq("pin", data.pin.trim()).eq("active", true).maybeSingle();
  if (error) throw new Error(error.message);
  if (!team) throw new Error("קוד PIN שגוי או צוות לא פעיל");
  return team;
});
const getShopData_createServerFn_handler = createServerRpc({
  id: "dd6cb2fcb81dc398cf1c7cdf76b43b9314eeed721c4784633396148c469d95be",
  name: "getShopData",
  filename: "src/lib/team.functions.ts"
}, (opts) => getShopData.__executeServer(opts));
const getShopData = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1)
}).parse(input)).handler(getShopData_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: team
  } = await supabaseAdmin.from("teams").select("id, name, monthly_limit, contact_phone").eq("pin", data.pin.trim()).eq("active", true).maybeSingle();
  if (!team) throw new Error("צוות לא תקין");
  const [{
    data: products
  }, {
    data: spent
  }] = await Promise.all([supabaseAdmin.from("products").select("*").eq("active", true).order("name"), supabaseAdmin.rpc("team_month_spent", {
    _team_id: team.id
  })]);
  const resolved = await resolveProductImages(supabaseAdmin, products ?? []);
  return {
    team,
    products: resolved.map((product) => ({
      ...product,
      price: addVat(Number(product.price))
    })),
    spent: Number(spent ?? 0)
  };
});
const itemSchema = objectType({
  product_id: stringType().uuid(),
  quantity: numberType().int().min(1).max(999)
});
const placeOrder_createServerFn_handler = createServerRpc({
  id: "385b5c5f9cc03331836f7729feeab0f123eaa87a0d056fe3b790ce29109db588",
  name: "placeOrder",
  filename: "src/lib/team.functions.ts"
}, (opts) => placeOrder.__executeServer(opts));
const placeOrder = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1),
  items: arrayType(itemSchema).min(1).max(200),
  notes: stringType().max(500).optional(),
  contact_phone: stringType().min(7).max(20),
  ordered_by_name: stringType().min(1).max(100)
}).parse(input)).handler(placeOrder_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: team
  } = await supabaseAdmin.from("teams").select("id, monthly_limit, active").eq("pin", data.pin.trim()).maybeSingle();
  if (!team || !team.active) throw new Error("צוות לא תקין");
  const ids = data.items.map((i) => i.product_id);
  const {
    data: products
  } = await supabaseAdmin.from("products").select("id, name, price, stock, active").in("id", ids);
  if (!products || products.length !== ids.length) throw new Error("חלק מהמוצרים לא נמצאו");
  let total = 0;
  const orderItems = data.items.map((i) => {
    const p = products.find((x) => x.id === i.product_id);
    if (!p.active) throw new Error(`המוצר ${p.name} אינו זמין`);
    if (p.stock < i.quantity) throw new Error(`אין מספיק מלאי עבור ${p.name}`);
    const priceWithVat = addVat(Number(p.price));
    total += priceWithVat * i.quantity;
    return {
      product_id: p.id,
      name: p.name,
      price: priceWithVat,
      quantity: i.quantity
    };
  });
  const {
    data: spentResp
  } = await supabaseAdmin.rpc("team_month_spent", {
    _team_id: team.id
  });
  const spent = Number(spentResp ?? 0);
  const limit = Number(team.monthly_limit);
  const requiresApproval = limit > 0 && spent + total > limit;
  const status = requiresApproval ? "awaiting_approval" : "pending";
  const {
    data: order,
    error: orderErr
  } = await supabaseAdmin.from("orders").insert({
    team_id: team.id,
    total,
    status,
    notes: data.notes,
    contact_phone: data.contact_phone,
    ordered_by_name: data.ordered_by_name
  }).select("id").single();
  if (orderErr || !order) throw new Error(orderErr?.message || "שגיאה ביצירת הזמנה");
  const {
    error: itemsErr
  } = await supabaseAdmin.from("order_items").insert(orderItems.map((it) => ({
    ...it,
    order_id: order.id
  })));
  if (itemsErr) throw new Error(itemsErr.message);
  if (!requiresApproval) {
    for (const it of orderItems) {
      const p = products.find((x) => x.id === it.product_id);
      const newStock = p.stock - it.quantity;
      await supabaseAdmin.from("products").update({
        stock: newStock
      }).eq("id", p.id);
      try {
        const {
          data: full
        } = await supabaseAdmin.from("products").select("id, name, low_stock_threshold, active").eq("id", p.id).maybeSingle();
        if (full?.active) {
          const {
            data: settingRow
          } = await supabaseAdmin.from("app_settings").select("value").eq("key", "default_low_stock_threshold").maybeSingle();
          const defaultThreshold = Number(settingRow?.value ?? 5);
          const threshold = full.low_stock_threshold ?? defaultThreshold;
          if (p.stock > threshold && newStock <= threshold) {
            const {
              sendPushToAdmins
            } = await import("./admin-push.server-mZQCgZIh.mjs");
            await sendPushToAdmins("low_stock", {
              title: newStock === 0 ? "מוצר אזל מהמלאי" : "התראת מלאי נמוך",
              body: `${full.name} — נשאר ${newStock} (סף ${threshold})`,
              url: "/admin/notifications"
            });
          }
        }
      } catch (e) {
        console.warn("[low stock notify on order] failed:", e?.message);
      }
    }
  }
  try {
    const {
      sendPushToAdmins
    } = await import("./admin-push.server-mZQCgZIh.mjs");
    const itemsLine = orderItems.map((i) => `${i.name}×${i.quantity}`).join(", ");
    const trimmed = itemsLine.length > 120 ? itemsLine.slice(0, 117) + "..." : itemsLine;
    if (requiresApproval) {
      await sendPushToAdmins("order_awaiting_approval", {
        title: "הזמנה ממתינה לאישור",
        body: `${data.ordered_by_name}: ₪${total.toFixed(0)} — ${trimmed}`,
        url: "/admin/orders"
      });
    } else {
      await sendPushToAdmins("order_created", {
        title: "הזמנה חדשה",
        body: `${data.ordered_by_name}: ₪${total.toFixed(0)} — ${trimmed}`,
        url: "/admin/orders"
      });
    }
  } catch (e) {
    console.warn("[admin notify new order] failed:", e?.message);
  }
  if (limit > 0) {
    try {
      const newSpent = spent + total;
      const monthDate = /* @__PURE__ */ new Date();
      monthDate.setUTCDate(1);
      monthDate.setUTCHours(0, 0, 0, 0);
      const month = monthDate.toISOString().slice(0, 10);
      const thresholds = [50, 80, 100];
      for (const t of thresholds) {
        const crossed = newSpent >= limit * t / 100;
        if (!crossed) continue;
        const {
          error: insErr
        } = await supabaseAdmin.from("team_budget_alerts").insert({
          team_id: team.id,
          threshold: t,
          month
        });
        if (insErr) continue;
        const pct = Math.min(100, Math.round(newSpent / limit * 100));
        const title = t >= 100 ? "חרגת מהמסגרת החודשית" : `ניצול תקציב ${t}%`;
        const body = t >= 100 ? `הצוות חרג מהמסגרת החודשית. נוצל ${pct}% מתקציב חודש זה.` : `הצוות ניצל ${pct}% מהתקציב החודשי.`;
        const {
          sendPushToTeam
        } = await import("./push.server-De5oApd4.mjs");
        await sendPushToTeam(team.id, {
          title,
          body,
          url: "/shop/orders"
        }).catch((e) => console.warn("[budget push] failed:", e?.message));
      }
    } catch (e) {
      console.warn("[budget alerts] failed:", e?.message);
    }
  }
  return {
    order_id: order.id,
    status,
    requires_approval: requiresApproval,
    total
  };
});
const repeatOrder_createServerFn_handler = createServerRpc({
  id: "8ccdf75c2ffa9db73fc1ce8f5df9ecb2d06f081f644110e2af9df09fe0721a64",
  name: "repeatOrder",
  filename: "src/lib/team.functions.ts"
}, (opts) => repeatOrder.__executeServer(opts));
const repeatOrder = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1),
  order_id: stringType().uuid()
}).parse(input)).handler(repeatOrder_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: team
  } = await supabaseAdmin.from("teams").select("id").eq("pin", data.pin.trim()).eq("active", true).maybeSingle();
  if (!team) throw new Error("צוות לא תקין");
  const {
    data: order
  } = await supabaseAdmin.from("orders").select("id, team_id, order_items(product_id, quantity, name)").eq("id", data.order_id).maybeSingle();
  if (!order || order.team_id !== team.id) throw new Error("הזמנה לא נמצאה");
  const productIds = order.order_items.map((i) => i.product_id).filter((x) => !!x);
  const {
    data: products
  } = productIds.length ? await supabaseAdmin.from("products").select("id, name, stock, active").in("id", productIds) : {
    data: []
  };
  const available = [];
  const skipped = [];
  for (const it of order.order_items) {
    if (!it.product_id) {
      skipped.push(it.name);
      continue;
    }
    const p = (products ?? []).find((x) => x.id === it.product_id);
    if (!p || !p.active) {
      skipped.push(it.name);
      continue;
    }
    const qty = Math.min(Number(it.quantity), Number(p.stock));
    if (qty <= 0) {
      skipped.push(it.name);
      continue;
    }
    available.push({
      product_id: it.product_id,
      quantity: qty
    });
  }
  return {
    items: available,
    skipped
  };
});
const getTeamOrders_createServerFn_handler = createServerRpc({
  id: "d25e036cf42d3e486eb39ee1810963dcc6544f74afa1621721cdd81efe7b35f6",
  name: "getTeamOrders",
  filename: "src/lib/team.functions.ts"
}, (opts) => getTeamOrders.__executeServer(opts));
const getTeamOrders = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1)
}).parse(input)).handler(getTeamOrders_createServerFn_handler, async ({
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
    data: orders,
    error
  } = await supabaseAdmin.from("orders").select("id, created_at, status, total, notes, ordered_by_name, contact_phone, order_items(id, product_id, name, price, quantity)").eq("team_id", team.id).order("created_at", {
    ascending: false
  }).limit(100);
  if (error) throw new Error(error.message);
  return {
    team,
    orders: (orders ?? []).map((order) => ({
      ...order,
      total: Number(order.total),
      order_items: (order.order_items ?? []).map((item) => ({
        ...item,
        price: Number(item.price)
      }))
    }))
  };
});
const editableOrderStatuses = ["pending", "awaiting_approval"];
async function loadOwnEditableOrder(supabaseAdmin, pin, order_id) {
  const {
    data: team
  } = await supabaseAdmin.from("teams").select("id, monthly_limit, active").eq("pin", pin.trim()).maybeSingle();
  if (!team || !team.active) throw new Error("צוות לא תקין");
  const {
    data: order
  } = await supabaseAdmin.from("orders").select("id, team_id, status, total, order_items(id, product_id, name, price, quantity)").eq("id", order_id).maybeSingle();
  if (!order || order.team_id !== team.id) throw new Error("הזמנה לא נמצאה");
  if (!editableOrderStatuses.includes(order.status)) {
    throw new Error("לא ניתן לערוך הזמנה זו");
  }
  return {
    team,
    order
  };
}
async function restoreStockForItems(supabaseAdmin, items) {
  for (const it of items) {
    if (!it.product_id) continue;
    const {
      data: p
    } = await supabaseAdmin.from("products").select("stock").eq("id", it.product_id).maybeSingle();
    if (!p) continue;
    await supabaseAdmin.from("products").update({
      stock: Number(p.stock) + Number(it.quantity)
    }).eq("id", it.product_id);
  }
}
const cancelOrder_createServerFn_handler = createServerRpc({
  id: "ba1059106764ba691e4484038b994a12454907108ebdd0dd8673f0cf4fc825ef",
  name: "cancelOrder",
  filename: "src/lib/team.functions.ts"
}, (opts) => cancelOrder.__executeServer(opts));
const cancelOrder = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1),
  order_id: stringType().uuid()
}).parse(input)).handler(cancelOrder_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    order
  } = await loadOwnEditableOrder(supabaseAdmin, data.pin, data.order_id);
  if (order.status === "pending") {
    await restoreStockForItems(supabaseAdmin, order.order_items);
  }
  const {
    error
  } = await supabaseAdmin.from("orders").update({
    status: "cancelled"
  }).eq("id", order.id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const editOrder_createServerFn_handler = createServerRpc({
  id: "8ed89391e0f669469e5038daa4785d98cf30fabfeaa675e970c9379a958d3259",
  name: "editOrder",
  filename: "src/lib/team.functions.ts"
}, (opts) => editOrder.__executeServer(opts));
const editOrder = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1),
  order_id: stringType().uuid(),
  items: arrayType(itemSchema).min(1).max(200),
  notes: stringType().max(500).optional(),
  contact_phone: stringType().min(7).max(20).optional(),
  ordered_by_name: stringType().min(1).max(100).optional()
}).parse(input)).handler(editOrder_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    team,
    order
  } = await loadOwnEditableOrder(supabaseAdmin, data.pin, data.order_id);
  if (order.status === "pending") {
    await restoreStockForItems(supabaseAdmin, order.order_items);
  }
  const ids = data.items.map((i) => i.product_id);
  const {
    data: products
  } = await supabaseAdmin.from("products").select("id, name, price, stock, active").in("id", ids);
  if (!products || products.length !== ids.length) throw new Error("חלק מהמוצרים לא נמצאו");
  let total = 0;
  const newItems = data.items.map((i) => {
    const p = products.find((x) => x.id === i.product_id);
    if (!p.active) throw new Error(`המוצר ${p.name} אינו זמין`);
    if (Number(p.stock) < i.quantity) throw new Error(`אין מספיק מלאי עבור ${p.name}`);
    const priceWithVat = addVat(Number(p.price));
    total += priceWithVat * i.quantity;
    return {
      order_id: order.id,
      product_id: p.id,
      name: p.name,
      price: priceWithVat,
      quantity: i.quantity
    };
  });
  const {
    data: spentResp
  } = await supabaseAdmin.rpc("team_month_spent", {
    _team_id: team.id
  });
  const spentOthers = Math.max(0, Number(spentResp ?? 0) - Number(order.total));
  const limit = Number(team.monthly_limit);
  const requiresApproval = limit > 0 && spentOthers + total > limit;
  const newStatus = requiresApproval ? "awaiting_approval" : "pending";
  await supabaseAdmin.from("order_items").delete().eq("order_id", order.id);
  const {
    error: insErr
  } = await supabaseAdmin.from("order_items").insert(newItems);
  if (insErr) throw new Error(insErr.message);
  const updateFields = {
    total,
    status: newStatus
  };
  if (data.notes !== void 0) updateFields.notes = data.notes;
  if (data.contact_phone !== void 0) updateFields.contact_phone = data.contact_phone;
  if (data.ordered_by_name !== void 0) updateFields.ordered_by_name = data.ordered_by_name;
  const {
    error: updErr
  } = await supabaseAdmin.from("orders").update(updateFields).eq("id", order.id);
  if (updErr) throw new Error(updErr.message);
  if (newStatus === "pending") {
    for (const it of newItems) {
      const p = products.find((x) => x.id === it.product_id);
      await supabaseAdmin.from("products").update({
        stock: Number(p.stock) - it.quantity
      }).eq("id", it.product_id);
    }
  }
  return {
    ok: true,
    status: newStatus,
    total
  };
});
export {
  cancelOrder_createServerFn_handler,
  editOrder_createServerFn_handler,
  getShopData_createServerFn_handler,
  getTeamOrders_createServerFn_handler,
  placeOrder_createServerFn_handler,
  repeatOrder_createServerFn_handler,
  verifyTeamPin_createServerFn_handler
};
