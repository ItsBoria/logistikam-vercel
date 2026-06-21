function isPushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}
function isIOSDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || ua.includes("Mac") && "ontouchend" in document;
}
function isStandaloneInstalled() {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = typeof navigator !== "undefined" && navigator.standalone === true;
  return !!(mq || iosStandalone);
}
function vapidKeyToUint8Array(base64Url) {
  if (!base64Url || typeof base64Url !== "string") {
    throw new Error("מפתח VAPID חסר");
  }
  const trimmed = base64Url.trim();
  if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) {
    throw new Error("מפתח VAPID לא תקין (תווים לא חוקיים)");
  }
  const padding = "=".repeat((4 - trimmed.length % 4) % 4);
  const base64 = (trimmed + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  if (arr.length !== 65) {
    throw new Error(`מפתח VAPID לא תקין (אורך ${arr.length} במקום 65 בתים)`);
  }
  return arr;
}
async function getExistingSubscription() {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  if (!reg) return null;
  return await reg.pushManager.getSubscription();
}
async function registerSW() {
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  return reg;
}
export {
  isIOSDevice as a,
  isPushSupported as b,
  getExistingSubscription as g,
  isStandaloneInstalled as i,
  registerSW as r,
  vapidKeyToUint8Array as v
};
