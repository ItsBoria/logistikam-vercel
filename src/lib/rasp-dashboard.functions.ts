import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const dateFilterSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  replacement_category: z.string().trim().max(100).optional().nullable(),
});

async function requireTeam(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: membership } = await (supabaseAdmin as any)
    .from("team_members")
    .select("team_id, teams(id, name, monthly_limit, active)")
    .eq("user_id", userId)
    .maybeSingle();
  const team = membership?.teams;
  if (!membership?.team_id || !team?.active) throw new Error("לא נמצא שיוך ליחידה פעילה");
  return { supabaseAdmin, teamId: membership.team_id as string, team };
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function defaultRange() {
  const now = new Date();
  return {
    from: `${now.getUTCFullYear()}-01-01`,
    to: isoDate(now),
  };
}

function money(value: unknown) {
  return Number(value ?? 0);
}

const openStatuses = ["pending", "awaiting_approval", "approved", "preparing", "ready"];
const spentStatuses = ["completed"];

export const getRaspDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => dateFilterSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin, teamId, team } = await requireTeam(context.userId);
    const defaults = defaultRange();
    const from = data.from ?? defaults.from;
    const to = data.to ?? defaults.to;
    if (from > to) throw new Error("טווח התאריכים אינו תקין");
    const fromIso = `${from}T00:00:00.000Z`;
    const toIso = `${to}T23:59:59.999Z`;

    const previousYearFrom = `${Number(from.slice(0, 4)) - 1}${from.slice(4)}`;
    const previousYearTo = `${Number(to.slice(0, 4)) - 1}${to.slice(4)}`;
    const previousMonthStart = new Date(`${to.slice(0, 7)}-01T00:00:00.000Z`);
    previousMonthStart.setUTCMonth(previousMonthStart.getUTCMonth() - 1);
    const previousMonthEnd = new Date(previousMonthStart);
    previousMonthEnd.setUTCMonth(previousMonthEnd.getUTCMonth() + 1);
    previousMonthEnd.setUTCDate(0);

    const [
      ordersResult,
      previousYearResult,
      previousMonthResult,
      replacementResult,
      replacementProductsResult,
      budgetPeriodResult,
      catalogRequestsResult,
    ] = await Promise.all([
      (supabaseAdmin as any)
        .from("orders")
        .select("id, total, status, created_at, ordered_by_name, order_items(id, product_id, name, price, quantity, category_id, products(id, item_code, unit_of_measure, category_id, item_categories(id, name, color)))")
        .eq("team_id", teamId).gte("created_at", fromIso).lte("created_at", toIso)
        .order("created_at", { ascending: false }),
      (supabaseAdmin as any).from("orders").select("total, status")
        .eq("team_id", teamId)
        .gte("created_at", `${previousYearFrom}T00:00:00.000Z`)
        .lte("created_at", `${previousYearTo}T23:59:59.999Z`),
      (supabaseAdmin as any).from("orders").select("total, status")
        .eq("team_id", teamId)
        .gte("created_at", previousMonthStart.toISOString())
        .lte("created_at", previousMonthEnd.toISOString()),
      (supabaseAdmin as any)
        .from("team_replacement_items")
        .select("*, replacement_products(id, name, description, category, image_url, active, takin_stock)")
        .eq("team_id", teamId).order("created_at", { ascending: false }),
      (supabaseAdmin as any).from("replacement_products")
        .select("id, name, description, category, image_url, active, takin_stock, balai_stock")
        .eq("active", true).order("category").order("name"),
      (supabaseAdmin as any).from("budget_periods")
        .select("id, starting_budget, carry_over_amount, used_amount, remaining_amount, starts_at, ends_at")
        .eq("team_id", teamId).eq("status", "active").maybeSingle(),
      (supabaseAdmin as any).from("item_catalog_requests").select("*")
        .eq("team_id", teamId).order("created_at", { ascending: false }).limit(20),
    ]);

    for (const result of [
      ordersResult, previousYearResult, previousMonthResult, replacementResult,
      replacementProductsResult, budgetPeriodResult, catalogRequestsResult,
    ]) {
      if (result.error && !["42P01", "42703"].includes(result.error.code)) {
        throw new Error(result.error.message);
      }
    }

    const allOrders = ordersResult.data ?? [];
    const completedOrders = allOrders.filter((order: any) => spentStatuses.includes(order.status));
    const openOrders = allOrders.filter((order: any) => openStatuses.includes(order.status));
    const spent = completedOrders.reduce((sum: number, order: any) => sum + money(order.total), 0);
    const reserved = openOrders.reduce((sum: number, order: any) => sum + money(order.total), 0);
    const allocated = budgetPeriodResult.data
      ? money(budgetPeriodResult.data.starting_budget) + money(budgetPeriodResult.data.carry_over_amount)
      : money(team.monthly_limit);
    const remaining = Math.max(0, allocated - spent - reserved);
    const previousYearSpent = (previousYearResult.data ?? [])
      .filter((order: any) => spentStatuses.includes(order.status))
      .reduce((sum: number, order: any) => sum + money(order.total), 0);
    const previousMonthSpent = (previousMonthResult.data ?? [])
      .filter((order: any) => spentStatuses.includes(order.status))
      .reduce((sum: number, order: any) => sum + money(order.total), 0);

    const itemMap = new Map<string, any>();
    const categoryMap = new Map<string, any>();
    const monthlyMap = new Map<string, any>();
    for (const order of completedOrders) {
      const month = String(order.created_at).slice(0, 7);
      const monthRow = monthlyMap.get(month) ?? { month, amount: 0, orders: 0, items: new Map<string, number>() };
      monthRow.amount += money(order.total);
      monthRow.orders += 1;
      for (const item of order.order_items ?? []) {
        const categoryId = item.category_id ?? item.products?.category_id;
        if (data.category_id && categoryId !== data.category_id) continue;
        const key = item.product_id ?? item.name;
        const row = itemMap.get(key) ?? {
          product_id: item.product_id,
          name: item.name,
          code: item.products?.item_code ?? null,
          quantity: 0,
          amount: 0,
          order_ids: new Set<string>(),
        };
        row.quantity += Number(item.quantity);
        row.amount += Number(item.price) * Number(item.quantity);
        row.order_ids.add(order.id);
        itemMap.set(key, row);
        monthRow.items.set(item.name, (monthRow.items.get(item.name) ?? 0) + Number(item.quantity));

        const category = item.products?.item_categories;
        const categoryKey = categoryId ?? "uncategorized";
        const categoryRow = categoryMap.get(categoryKey) ?? {
          id: categoryId,
          name: category?.name ?? "ללא קטגוריה",
          color: category?.color ?? "#64748b",
          amount: 0,
        };
        categoryRow.amount += Number(item.price) * Number(item.quantity);
        categoryMap.set(categoryKey, categoryRow);
      }
      monthlyMap.set(month, monthRow);
    }
    const totalQuantity = [...itemMap.values()].reduce((sum, item) => sum + item.quantity, 0);
    const items = [...itemMap.values()].map((item) => ({
      ...item,
      orders: item.order_ids.size,
      percentage: totalQuantity ? Math.round((item.quantity / totalQuantity) * 100) : 0,
      order_ids: undefined,
    }));
    const monthly = [...monthlyMap.values()].sort((a, b) => a.month.localeCompare(b.month)).map((row) => ({
      month: row.month,
      amount: row.amount,
      orders: row.orders,
      top_item: [...row.items.entries()].sort((a: any, b: any) => b[1] - a[1])[0]?.[0] ?? null,
    }));

    const today = defaults.to;
    const soon = new Date(`${today}T00:00:00.000Z`);
    soon.setUTCDate(soon.getUTCDate() + 7);
    const replacements = (replacementResult.data ?? []).map((item: any) => {
      const derivedStatus = item.status !== "returned"
        && item.status !== "lost_or_damaged"
        && item.expected_return_date
        && item.expected_return_date < today
        ? "overdue"
        : item.status;
      return { ...item, status: derivedStatus };
    });
    const replacementSummary = {
      held: replacements.filter((item: any) => ["held", "awaiting_return"].includes(item.status)).length,
      returned: replacements.filter((item: any) => item.status === "returned").length,
      overdue: replacements.filter((item: any) => item.status === "overdue").length,
      due_soon: replacements.filter((item: any) =>
        item.expected_return_date
        && item.expected_return_date >= today
        && item.expected_return_date <= isoDate(soon)
        && item.status !== "returned",
      ).length,
    };

    const orderCounts = Object.fromEntries(
      ["pending", "awaiting_approval", "approved", "preparing", "ready", "completed"]
        .map((status) => [status, allOrders.filter((order: any) => order.status === status).length]),
    );
    const recentActivity = [
      ...allOrders.slice(0, 8).map((order: any) => ({
        id: `order-${order.id}`,
        type: "order",
        title: `הזמנה ${order.id.slice(0, 8)}`,
        status: order.status,
        at: order.created_at,
        amount: money(order.total),
      })),
      ...replacements.slice(0, 8).map((item: any) => ({
        id: `replacement-${item.id}`,
        type: "replacement",
        title: item.products?.name ?? "פריט החלפה",
        status: item.status,
        at: item.returned_at ?? item.created_at,
        amount: null,
      })),
    ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10);

    return {
      team: { id: teamId, name: team.name },
      range: { from, to },
      budget: {
        allocated,
        spent,
        reserved,
        remaining,
        used_percentage: allocated ? Math.min(100, Math.round(((spent + reserved) / allocated) * 100)) : 0,
      },
      comparison: {
        previous_year: previousYearSpent,
        previous_year_percentage: previousYearSpent
          ? Math.round(((spent - previousYearSpent) / previousYearSpent) * 100)
          : null,
        previous_month: previousMonthSpent,
      },
      order_counts: orderCounts,
      replacements,
      replacement_summary: replacementSummary,
      items_by_quantity: [...items].sort((a, b) => b.quantity - a.quantity).slice(0, 10),
      items_by_spending: [...items].sort((a, b) => b.amount - a.amount).slice(0, 10),
      items_by_frequency: [...items].sort((a, b) => b.orders - a.orders).slice(0, 10),
      monthly,
      categories_spending: [...categoryMap.values()].sort((a, b) => b.amount - a.amount),
      categories: categoriesResult.data ?? [],
      products: productsResult.data ?? [],
      catalog_requests: catalogRequestsResult.data ?? [],
      recent_activity: recentActivity,
    };
  });

const replacementSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(9999),
  received_from_name: z.string().trim().min(1).max(150),
  received_from_phone: z.string().trim().max(50).optional().nullable(),
  received_from_unit: z.string().trim().max(150).optional().nullable(),
  received_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expected_return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  condition_received: z.string().trim().max(500).optional().nullable(),
  serial_number: z.string().trim().max(150).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  attachment_path: z.string().trim().max(500).optional().nullable(),
});

export const createTeamReplacementItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => replacementSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin, teamId } = await requireTeam(context.userId);
    if (data.expected_return_date && data.expected_return_date < data.received_date) {
      throw new Error("תאריך ההחזרה אינו יכול להיות לפני תאריך הקבלה");
    }
    if (data.attachment_path && !data.attachment_path.startsWith(`${teamId}/`)) {
      throw new Error("קובץ מצורף אינו שייך ליחידה");
    }
    const { data: product } = await (supabaseAdmin as any)
      .from("products")
      .select("id, active, can_be_replacement, maximum_quantity, category_id, item_categories(is_active)")
      .eq("id", data.product_id).maybeSingle();
    if (!product?.active || !product.can_be_replacement || !product.item_categories?.is_active) {
      throw new Error("הפריט אינו מאושר לשימוש כפריט החלפה");
    }
    if (product.maximum_quantity && data.quantity > product.maximum_quantity) {
      throw new Error(`הכמות המרבית לפריט זה היא ${product.maximum_quantity}`);
    }
    const { data: created, error } = await (supabaseAdmin as any)
      .from("team_replacement_items")
      .insert({
        ...data,
        team_id: teamId,
        user_id: context.userId,
        status: data.expected_return_date ? "awaiting_return" : "held",
      }).select("id").single();
    if (error) throw new Error(error.message);
    await (supabaseAdmin as any).from("team_replacement_item_history").insert({
      replacement_item_id: created.id,
      team_id: teamId,
      action: "created",
      actor_user_id: context.userId,
      details: { product_id: data.product_id, quantity: data.quantity },
    });
    return { ok: true, id: created.id };
  });

export const returnTeamReplacementItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    id: z.string().uuid(),
    actual_return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    returned_to_name: z.string().trim().min(1).max(150),
    condition_returned: z.string().trim().max(500).optional().nullable(),
    notes: z.string().trim().max(2000).optional().nullable(),
    confirmed: z.literal(true),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin, teamId } = await requireTeam(context.userId);
    const { data: item } = await (supabaseAdmin as any)
      .from("team_replacement_items").select("id, status, received_date")
      .eq("id", data.id).eq("team_id", teamId).maybeSingle();
    if (!item) throw new Error("פריט ההחלפה לא נמצא");
    if (item.status === "returned") throw new Error("הפריט כבר סומן כמוחזר");
    if (data.actual_return_date < item.received_date) throw new Error("תאריך ההחזרה אינו תקין");
    const { error } = await (supabaseAdmin as any).from("team_replacement_items").update({
      status: "returned",
      actual_return_date: data.actual_return_date,
      returned_to_name: data.returned_to_name,
      condition_returned: data.condition_returned ?? null,
      notes: data.notes ?? null,
      returned_at: new Date().toISOString(),
      returned_by: context.userId,
    }).eq("id", data.id).eq("team_id", teamId);
    if (error) throw new Error(error.message);
    await (supabaseAdmin as any).from("team_replacement_item_history").insert({
      replacement_item_id: data.id,
      team_id: teamId,
      action: "returned",
      actor_user_id: context.userId,
      details: {
        actual_return_date: data.actual_return_date,
        returned_to_name: data.returned_to_name,
      },
    });
    return { ok: true };
  });

export const requestCatalogItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    suggested_name: z.string().trim().min(2).max(150),
    suggested_category_id: z.string().uuid().optional().nullable(),
    reason: z.string().trim().min(3).max(1000),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin, teamId } = await requireTeam(context.userId);
    if (data.suggested_category_id) {
      const { data: category } = await (supabaseAdmin as any)
        .from("item_categories").select("id, is_active")
        .eq("id", data.suggested_category_id).maybeSingle();
      if (!category?.is_active) throw new Error("הקטגוריה אינה פעילה");
    }
    const { error } = await (supabaseAdmin as any).from("item_catalog_requests").insert({
      ...data,
      team_id: teamId,
      requested_by: context.userId,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const uploadReplacementAttachment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    filename: z.string().min(1).max(200),
    content_type: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
    data_base64: z.string().min(1).max(15_000_000),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin, teamId } = await requireTeam(context.userId);
    const ext = (data.filename.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${teamId}/${context.userId}/${crypto.randomUUID()}.${ext}`;
    const bytes = Buffer.from(data.data_base64, "base64");
    if (bytes.byteLength > 7_500_000) throw new Error("הקובץ גדול מדי");
    const { error } = await supabaseAdmin.storage.from("replacement-attachments").upload(path, bytes, {
      contentType: data.content_type,
      upsert: false,
    });
    if (error) throw new Error(error.message);
    return { path };
  });
