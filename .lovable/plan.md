# UX & Management Upgrades

Four focused improvements based on your priorities. Every text stays in Hebrew, no added tooltips/onboarding.

---

## 1. Simpler admin login — username + password

Today admins log in with an email. We'll switch the UI to **username only** (e.g. `admin`, `dani`) while keeping the existing auth system underneath.

**How it works:** the server maps a username to a synthetic internal email (`<username>@admins.local`) before calling auth. The user never sees an email field.

- Replace the email input on `/admin/login` with a "שם משתמש" input.
- New server fn `signInWithUsername({ username, password })` and `bootstrapAdminWithUsername({ username, password })` that translate username → internal email and call the existing auth.
- Existing admin (if any) is migrated once: a one-time migration updates their email to `<username>@admins.local` based on a username derived from the local part of their current email, or we add a "set username" step on first login.
- No change to roles/permissions — `user_roles` table still drives admin access.

---

## 2. Admin dashboard with KPIs (`/admin`)

Today `/admin/index.tsx` is a plain landing. Replace with a real dashboard:

- **4 KPI cards**: pending orders, orders this month, revenue this month, active teams.
- **Top 5 teams by spend this month** (with % of their monthly limit used + colored bar).
- **Recent 5 orders** with one-click status change (pending → approved → ready → delivered).
- **Low stock alert list** (products with stock ≤ 3).

All data via one server fn `getAdminDashboard()` (admin-only).

---

## 3. Team budget controls

- **In the dashboard**: per-team "remaining budget" bar, red when < 15%, with one-click "increase limit" inline editor.
- **New table `team_budget_alerts`** so we only notify each team once per threshold per month (50%, 80%, 100%).
- **Push notification to the team** when their order pushes them past 80% or 100% of their monthly limit. Reuses the existing push pipeline.
- **In the shop header**: when remaining < 20% of limit, show a clear orange banner (not just text) so teams notice before checkout.

---

## 4. Quick reorder + simpler checkout for teams

- **`/shop/orders` (existing page)**: add a "הזמן שוב" button on each past order that re-creates the cart with the same items (skipping out-of-stock items, with a toast listing them).
- **Remember name + phone**: persist last-used `ordered_by_name` and `contact_phone` in `localStorage` per team PIN so the checkout dialog pre-fills them.
- **Bigger touch targets**: qty +/- buttons enlarged to `h-10 w-10` on mobile, cart button shows total price next to the count, sticky "מעבר לתשלום" bar at the bottom of the screen when the cart isn't empty (mobile only) so teams don't hunt for the cart button.

---

## Technical details

**Database migration:**
```sql
CREATE TABLE public.team_budget_alerts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null,
  threshold int not null,      -- 50, 80, 100
  month date not null,         -- date_trunc('month', now())::date
  created_at timestamptz not null default now(),
  unique (team_id, threshold, month)
);
-- GRANTs + RLS (admin-only; alerts are written by server fns using service role)
```

**New / changed files:**
- `src/lib/admin-auth.functions.ts` — username→email login, bootstrap, "set username".
- `src/lib/admin-dashboard.functions.ts` — `getAdminDashboard`, `updateOrderStatus`, `setTeamMonthlyLimit`.
- `src/lib/team.functions.ts` — extend `placeOrder` to insert into `team_budget_alerts` + send push when crossing thresholds; new `repeatOrder(orderId)` that returns the items.
- `src/routes/admin.login.tsx` — username-only form.
- `src/routes/admin.index.tsx` — dashboard.
- `src/routes/shop.index.tsx` — sticky checkout bar, bigger qty buttons, persisted contact info, prominent budget banner.
- `src/routes/shop.orders.tsx` — "הזמן שוב" buttons.

**Out of scope (can do later if you want):** bulk admin order actions, inline product editing, in-app guidance/tooltips.

