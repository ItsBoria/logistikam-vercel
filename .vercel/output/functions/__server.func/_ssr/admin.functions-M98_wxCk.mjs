import { c as createSsrRpc } from "./createSsrRpc-BIyD4fIx.mjs";
import { a as createServerFn } from "./server-CIKTFqrt.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DIPMndrz.mjs";
import { o as objectType, e as enumType, s as stringType, n as numberType, b as booleanType, a as arrayType } from "../_libs/zod.mjs";
const listAdminUsers = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("8b0453aaedcd8ffb3f94b29f9a5c0af1ac36e00b3de1fd5ea828663e9feaa15d"));
const createAdminUser = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  email: stringType().email(),
  username: stringType().min(2).max(40).regex(/^[a-zA-Z0-9_.-]+$/, "שם משתמש לא תקין"),
  password: stringType().min(8).max(72),
  role: enumType(["admin", "staff"]).default("admin")
}).parse(input)).handler(createSsrRpc("5b2fa8b9e283673ffda98e7e19731f1aece3f1d2453b8825510a0e996c39e023"));
const updateAdminUserRole = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  user_id: stringType().uuid(),
  role: enumType(["admin", "staff", "customer"])
}).parse(input)).handler(createSsrRpc("caef67c2309bac25ed92a956b2bc3d0755225bda81ab667185aaa9bbe693fa36"));
const searchRegisteredUsers = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  query: stringType().max(200).optional().default("")
}).parse(input)).handler(createSsrRpc("6ddf45e49abf16c46afaf8c918aa018d9cb0731c2a2b7a9deae17f51f4507faf"));
const deleteAdminUser = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  user_id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("71fa5d36fb064be3e1fa09a177b9f88400e4dc7e03003c59ff0bd89580fca2b5"));
const listTeams = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("98a6d64f9cd5f7feec4f5390a1d88971764e2c1ebd2cafdf00e90316e614e42f"));
const listTeamsBasic = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("6a00edf67717aa0e703cd3028e6880e64e7ba5b03ec0ca04ea90b3d84922ac45"));
const upsertTeam = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid().optional(),
  name: stringType().min(1).max(100),
  pin: stringType().min(4).max(20),
  monthly_limit: numberType().min(0).max(1e7),
  contact_phone: stringType().max(20).optional().nullable(),
  active: booleanType()
}).parse(input)).handler(createSsrRpc("8ee812c7ed33945cdc3d2e846a278e2baca76b4116489796e6270d26acc4c36b"));
const deleteTeam = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("f4abb2f516d17413a27910aaa96a88f6d894953a022ba168d70621e59210c2bf"));
const listProductsAdmin = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("028985d334aec8d7cdc146c91902c6f16ea9c1031f7ddc27db0b3a16b17866f1"));
const updateProductStock = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid(),
  stock: numberType().int().min(0).max(1e7),
  low_stock_threshold: numberType().int().min(0).max(1e7).nullable().optional()
}).parse(input)).handler(createSsrRpc("698e7b644f2127657b17d7fa8cd0081a5e6244ae41cfa33c442d8ba74228d550"));
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
const getAppSettings = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("44b296f25bd32f8dd64469d70316ca9ea195e718bda2a1c95acfb24b639022f3"));
const setDefaultLowStockThreshold = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  value: numberType().int().min(0).max(1e7)
}).parse(input)).handler(createSsrRpc("8cb3f55fd5dfe2728a088a11da13ea94b6b895a05c01278d692ff7d3aeeb3ada"));
const upsertProduct = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => productSchema.parse(input)).handler(createSsrRpc("87057b699c92d5e9cc4f021e767a44009606525481c8a27886c5fc0375dc6625"));
const uploadProductImage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  filename: stringType().min(1).max(200),
  content_type: stringType().min(1).max(100),
  data_base64: stringType().min(1).max(15e6)
}).parse(input)).handler(createSsrRpc("b1533cd6d84f2230b6fad65cfed09e4ce9425a1e77d301f3bbf8445b48ce7957"));
const deleteProduct = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("d58e9647e4364d7098cb0d840b98a827719a64c5b316ad80080e28b97fb3f1cb"));
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
}).parse(input)).handler(createSsrRpc("8637ce4d3448bb944af09ee1021a2459ee5efdd45dd8d34dd382017d2a791ba0"));
const listOrders = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  team_id: stringType().uuid().nullable().optional(),
  status: stringType().nullable().optional(),
  from: stringType().nullable().optional(),
  to: stringType().nullable().optional(),
  search: stringType().max(200).nullable().optional()
}).parse(input)).handler(createSsrRpc("417c9a43e3b2c8a52369c51aeba4e0a3cfd0fcc464e265d473e113f9511a245b"));
const getOrderDetail = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("b8a39fcf137f82271ea7ed6209f080b5dbcd81cd0cb41de2802d816577ca7f78"));
const updateAdminNotes = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid(),
  admin_notes: stringType().max(2e3).nullable()
}).parse(input)).handler(createSsrRpc("26b17d5eda570c8a30a5b5221ef756856bb2ec8f77ebf605d11e2dd87977ec05"));
const updateOrderStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid(),
  status: enumType(["pending", "approved", "preparing", "ready", "completed", "cancelled", "awaiting_approval"])
}).parse(input)).handler(createSsrRpc("573e69518e877f2ce18e3820832cb2cb45d1a897de1933c05de86f50fa9a7e10"));
const orderItemEditSchema = objectType({
  id: stringType().uuid().optional(),
  product_id: stringType().uuid().nullable().optional(),
  name: stringType().min(1).max(200),
  price: numberType().min(0).max(1e7),
  quantity: numberType().int().min(1).max(999)
});
const updateOrderItems = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  order_id: stringType().uuid(),
  items: arrayType(orderItemEditSchema).min(1).max(200),
  notes: stringType().max(500).optional().nullable()
}).parse(input)).handler(createSsrRpc("9733ae8e477760272965b9be57e939d92f80057ec1a3b041dd5ba5702c84e92f"));
const deleteOrder = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("07850f6c9d8e9da3fa8132f60803ccc47e3a38d1f0458b109154e2f171bfdfa9"));
const deleteOldOrders = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  before: stringType().min(1),
  only_completed: booleanType().optional()
}).parse(input)).handler(createSsrRpc("66c0768d6ba7b8f204c84a895184d6277f07fb21ec2d9bb4832920c3a991cc67"));
export {
  updateAdminUserRole as a,
  searchRegisteredUsers as b,
  createAdminUser as c,
  deleteAdminUser as d,
  listTeams as e,
  upsertTeam as f,
  getAppSettings as g,
  deleteTeam as h,
  listProductsAdmin as i,
  updateProductStock as j,
  uploadProductImage as k,
  listAdminUsers as l,
  upsertProduct as m,
  deleteProduct as n,
  bulkImportProducts as o,
  listOrders as p,
  listTeamsBasic as q,
  updateOrderItems as r,
  setDefaultLowStockThreshold as s,
  deleteOrder as t,
  updateOrderStatus as u,
  deleteOldOrders as v,
  getOrderDetail as w,
  updateAdminNotes as x
};
