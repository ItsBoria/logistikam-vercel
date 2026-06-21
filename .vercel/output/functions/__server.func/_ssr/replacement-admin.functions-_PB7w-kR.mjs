import { c as createSsrRpc } from "./createSsrRpc-BIyD4fIx.mjs";
import { a as createServerFn } from "./server-CIKTFqrt.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DIPMndrz.mjs";
import { o as objectType, e as enumType, r as recordType, s as stringType, b as booleanType, n as numberType, a as arrayType } from "../_libs/zod.mjs";
const listReplacementProducts = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("09cb7d7ca4eee985fc5e272976dbf836fa9313305d2ccbdbc56b60816cd774ff"));
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
const upsertReplacementProduct = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => replacementProductSchema.parse(input)).handler(createSsrRpc("42b25249993e7703bc19024de873934aca1b5ef7e6d3acd5442557482e49be99"));
const deleteReplacementProduct = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("43b3991a1fa84994975b9db4ebb96be73f50f619893529b95c847271e0f7d89f"));
const adjustReplacementStock = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid(),
  takin_delta: numberType().int().min(-1e6).max(1e6),
  balai_delta: numberType().int().min(-1e6).max(1e6)
}).parse(input)).handler(createSsrRpc("d39722ebf4e8d28ac540555c18345aea18f5416cd4caedfca91c4e8f624072a5"));
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
}).parse(input)).handler(createSsrRpc("2bfafc2a26efd5840cf19a213937176fea015d3ec165a0fe639cc4ab40f92629"));
const listReplacementRequests = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  status: enumType(["preparing", "ready", "done", "cancelled"]).nullable().optional()
}).parse(input)).handler(createSsrRpc("9fd13b68f5978e003c48f7983aea6dff054e65f01f49ff418628f320ab3acfe3"));
const updateReplacementStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid(),
  action: enumType(["ready", "done", "cancel"]),
  // Only used when action === "done": per-item flag whether team returned broken unit (→ balai)
  return_balai: recordType(stringType().uuid(), booleanType()).optional()
}).parse(input)).handler(createSsrRpc("a885eb9d070b1b6d8f31b2d974378fd99fd4d18256a1c6b703731814cb37a534"));
export {
  listReplacementProducts as a,
  upsertReplacementProduct as b,
  adjustReplacementStock as c,
  deleteReplacementProduct as d,
  bulkImportReplacementProducts as e,
  listReplacementRequests as l,
  updateReplacementStatus as u
};
