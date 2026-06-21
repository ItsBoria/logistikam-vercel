import { c as createSsrRpc } from "./createSsrRpc-BIyD4fIx.mjs";
import { a as createServerFn } from "./server-CIKTFqrt.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
const getVapidPublicKey = createServerFn({
  method: "GET"
}).handler(createSsrRpc("78cc8d1f6340d6a3afbbfa56eb27d07047d617e75a30cf50925c68148d0e296a"));
const subSchema = objectType({
  pin: stringType().min(1).max(32),
  endpoint: stringType().url().max(2e3),
  p256dh: stringType().min(1).max(500),
  auth: stringType().min(1).max(500)
});
const subscribePush = createServerFn({
  method: "POST"
}).inputValidator((input) => subSchema.parse(input)).handler(createSsrRpc("20d552c35a38dd47e4edd6ef7a4daca2264e2218f13a0923265709959b22832a"));
const unsubscribePush = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  endpoint: stringType().url()
}).parse(input)).handler(createSsrRpc("8715e07497c3562a6ef2a16117120f69295676a0b698d567b2651be0cf3c9999"));
const sendTestPush = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1).max(32)
}).parse(input)).handler(createSsrRpc("f58b21b44b8a2a06145fee076324bf6c4b16dc1ba81aa78a98b43fae6cea4152"));
export {
  sendTestPush as a,
  getVapidPublicKey as g,
  subscribePush as s,
  unsubscribePush as u
};
