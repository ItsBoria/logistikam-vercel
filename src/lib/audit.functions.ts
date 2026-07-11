import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertFunctionOwner as assertOwner } from "./authz.functions";

export const listAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    action_type: z.string().trim().max(80).optional().default(""),
    target_type: z.string().trim().max(80).optional().default(""),
    limit: z.number().int().min(1).max(200).optional().default(100),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = (supabaseAdmin as any)
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.action_type) query = query.eq("action_type", data.action_type);
    if (data.target_type) query = query.eq("target_type", data.target_type);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
