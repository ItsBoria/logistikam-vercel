// Service worker for Web Push notifications
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = { title: "התראה", body: "" };
  try { if (event.data) data = event.data.json(); } catch (_) {}
  const title = data.title || "התראה";
  const options = {
    body: data.body || "",
    icon: "/logistikam-logo.png",
    badge: "/logistikam-logo.png",
    dir: "rtl",
    lang: "he",
    data: { url: data.url || "/shop/orders" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ("focus" in c) { c.navigate(url); return c.focus(); }
      }
      return self.clients.openWindow(url);
    })
  );
});
