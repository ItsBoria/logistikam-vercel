# LogistikaM Codebase Guide

This file is a living map of the LogistikaM codebase. Read it before making changes so you do not need to rediscover the project structure every time.

Last updated: 2026-07-11

## Project overview

LogistikaM is a Hebrew/RTL logistics web application for military-style unit workflows. It includes:

- A public/team-facing store entered by team PIN.
- A replacement-items store entered by team PIN.
- A regular unit/RASP dashboard for replacement-item tracking.
- An authenticated admin panel for products, inventory, orders, teams, budgets, notifications, weekly calendar, users, and audit logs.
- Supabase for auth, database, storage, server-side privileged operations, and migrations.
- Vercel/Nitro output through TanStack Start/Vite.

The important product rule after the Unit/Team correction:

- `public.units` is the organization/tenant boundary.
- `public.teams` are customer groups inside a Unit and must have `teams.unit_id`.
- Unit administrators belong to Units through `unit_memberships`.
- Normal Team users belong to Teams through `team_memberships`.
- Products, item categories, replacement products, orders, budgets, missions, RASP data, reports, notifications, and audit data should be scoped by `unit_id`; Team-specific data also needs `team_id`.
- Unit admins may manage all Teams inside their active Unit without separate Team membership for every Team.
- Normal users must only see Teams where they have explicit active Team membership.
- Do not use `teams` as the tenant boundary going forward.

## Unit onboarding and access workflow

The app now separates platform ownership from day-to-day Unit user approval:

- The single platform Owner creates or approves Units and can switch between Units.
- Once a Unit exists, Unit admins manage users inside that Unit.
- New authenticated users with no Unit access land on `src/routes/select-team.tsx`, choose a Unit, and submit a row in `public.unit_access_requests`.
- Unit admins review pending Unit access requests in `src/routes/admin.users.tsx` under the "בקשות גישה" tab.
- Approving a request creates or updates `unit_memberships` for that Unit and can also assign the user to a Team through `team_memberships` / legacy `team_members`.
- Owner users should not need to approve every normal user. Owner approval is only for Unit-level lifecycle and platform-wide control.
- Unit admin access checks must read `unit_memberships`, not only legacy/global `user_roles`.
- If a non-owner Unit admin has no active Unit selected, `assertActiveUnit` auto-selects their first accessible Unit so original-unit admins do not see empty admin screens.
- All pre-multitenant/original data belongs to the `ORIGINAL` Unit. If a legacy row has a Team, derive `unit_id` from that Team; if it has no usable Team, attach it to `ORIGINAL`. The repair migration is `supabase/migrations/20260711172000_original_unit_legacy_data_backfill.sql`.

Role level model:

1. `OWNER` / platform owner: David, sees every Unit but works inside a selected active Unit for scoped pages.
2. Unit admins: `WORK_MANAGER`, `LOGISTICS_NCO`, `UNIT_ADMIN`, `UNIT_OWNER`; these map to admin panel access for the active Unit.
3. Unit customers / RASP users: `UNIT_USER` plus optional Team membership (`RASP`) for team-scoped screens.

## Technology stack

- React 19
- TypeScript
- Vite
- TanStack Router
- TanStack Start server functions
- TanStack Query
- Supabase JS
- Tailwind CSS 4
- Radix UI components
- Framer Motion
- jsPDF / docx / xlsx for exports
- Web Push for browser notifications

Main commands:

```bash
pnpm run dev
pnpm run build
pnpm run lint
pnpm run format
```

In Codex Desktop on David's machine, the bundled pnpm path may be:

```powershell
C:\Users\david\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd
```

If package post-install scripts cannot find `node`, prepend the bundled Node folder to `PATH` before running the build:

```powershell
$env:PATH='C:\Users\david\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:PATH
```

## Repository structure

```text
src/
  components/              Shared app components and admin/store shells
  components/ui/           Reusable Radix/Tailwind UI primitives
  hooks/                   Client hooks for mobile/session/admin-role/preference state
  integrations/supabase/   Supabase browser/server clients and auth middleware
  lib/                     Server functions, domain logic, exports, push, authz
  routes/                  File-based TanStack Router pages
  router.tsx               Router creation
  routeTree.gen.ts         Generated route tree; do not hand-edit
  server.ts                Server entry
  start.ts                 Client entry
  styles.css               Global styling

supabase/
  migrations/              Database schema and repair migrations
  config.toml              Supabase local config

public/
  manifest.webmanifest     PWA manifest
  sw.js                    Service worker
  logo/favicon assets

docs/
  Supplemental docs such as OAuth branding guidance
```

## Routing map

Routes are file-based under `src/routes`.

### Root and landing

- `src/routes/__root.tsx`  
  Root route, global shell wiring, error boundary, global providers.

- `src/routes/index.tsx`  
  Main landing/login flow. Handles admin/store entry paths and team context checks.

- `src/routes/select-team.tsx`  
  Authenticated two-step Unit → Team selection flow. Shows only authorized Units, then only authorized Teams inside the selected Unit.

### Team/store routes

- `src/routes/shop.index.tsx`  
  Main team store. Uses a PIN-based team session and calls `getShopData` / `placeOrder`.

- `src/routes/shop.orders.tsx`  
  Team order history, repeat/edit/cancel flows.

- `src/routes/shop.replacements.tsx`  
  Team-facing replacement request store.

- `src/routes/shop.dashboard.tsx`  
  RASP/unit dashboard for held replacement items, returns, search/filtering, and related actions.

### Admin routes

- `src/routes/admin.login.tsx`  
  Admin login page.

- `src/routes/admin.index.tsx`  
  Admin dashboard/home page. It must not load unit-scoped dashboard data until an active Unit exists and is selected. Owner users see a first-unit setup card when no active Unit is available.

- `src/routes/admin.orders.tsx`  
  Admin order management.

- `src/routes/admin.products.tsx`  
  Admin product/category management.

- `src/routes/admin.stock.tsx`  
  Stock-focused product inventory management.

- `src/routes/admin.replacements.tsx`  
  Admin replacement request management.

- `src/routes/admin.replacement-inventory.tsx`  
  Admin replacement product inventory (`takin_stock`, `balai_stock`).

- `src/routes/admin.teams.tsx`  
  Team/unit management.

- `src/routes/admin.units.tsx`  
  Owner-only Unit management page. Supports search, create, edit branding/contact/status, deactivate, and soft-delete. Creating a Unit also selects it as the active Unit for the Owner.

- `src/routes/admin.users.tsx`  
  User/admin management and team assignment.

- `src/routes/admin.budgets.tsx`  
  Budget policy/period management.

- `src/routes/admin.calendar.tsx`  
  Weekly calendar/mission planning.

- `src/routes/admin.notifications.tsx`  
  Notification preferences, push subscriptions, low-stock lists.

- `src/routes/admin.preferences.tsx`  
  Per-admin preferences such as default admin section and enabled notification channels.

- `src/routes/admin.audit.tsx`  
  Audit log viewing.

## Core app shells and UI

- `src/components/admin-shell.tsx`  
  Main admin navigation shell. Check here when admin menu items disappear or role visibility changes.

- `src/components/bottom-tab-bar.tsx`  
  Store/mobile bottom navigation. Includes cart pill behavior and cart context integration.

- `src/components/admin-bottom-tab-bar.tsx`  
  Admin mobile navigation. Unit-scoped badge queries must be disabled until an active Unit is selected.

- `src/components/brand-logo.tsx`  
  Logo rendering.

- `src/components/page-transition.tsx`  
  Page transition animation wrapper.

- `src/components/push-toggle.tsx`  
  Client push-notification toggle UI.

- `src/components/install-button.tsx`  
  PWA install prompt UI.

- `src/components/ui/*`  
  Shared component primitives. Prefer reusing these instead of inventing one-off UI.

## Supabase integration

- `src/integrations/supabase/client.ts`  
  Browser Supabase client. Uses public env variables.

- `src/integrations/supabase/client.server.ts`  
  Server-side Supabase clients, including service-role/admin access where needed.

- `src/integrations/supabase/auth-middleware.ts`  
  Middleware for server functions that require a signed-in Supabase user.

- `src/integrations/supabase/auth-attacher.ts`  
  Auth/session attachment helper.

- `src/integrations/supabase/types.ts`  
  Supabase generated/hand-maintained types.

Important environment variables seen in this project:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- VAPID/Web Push variables, depending on deployment setup

The app has used both Vite-style and Next-style Supabase variable names during migration work. Before changing auth/client setup, inspect current Vercel env vars and `src/integrations/supabase/*`.

## Authorization and roles

### Global role helper

- `src/lib/authz.server.ts`

Defines:

- `RoleCode = "OWNER" | "WORK_MANAGER" | "ADMIN" | "USER"`
- `ROLE_LEVEL`
- `getUserRole(userId)`
- `assertMinRole(userId, minimum)`
- `assertOwner(userId)`

Current role model:

1. `OWNER`: the single global app owner. The owner can see all units in selectors and manage global setup, but operational admin screens still work through a selected active unit.
2. `WORK_MANAGER` / `ADMIN`: unit admin level. Hebrew labels are מנהל עבודה and נגד לוגיסטיקה. These roles manage the unit they are assigned to.
3. `USER`: client/RASP level. Hebrew label is רס״פ. This level uses the store/RASP flows and should not manage global/unit admin settings.

Compatibility notes:

- `WORK_MANAGER` and `ADMIN` currently share the same permission level in code.
- legacy `STAFF` is treated like `ADMIN` in some places.
- `supabase/migrations/20260710123000_single_owner_active_unit_scope.sql` enforces only one active `OWNER` role.

### Unit and Team membership

- `src/lib/membership.functions.ts`

Main functions:

- `listActiveUnits`
- `getMyActiveUnit`
- `setMyUnit`
- `listTeamsForActiveUnit`
- `getMyTeamContext`
- `listActiveTeams` (compatibility alias for active-Unit Teams)
- `getMyActiveAdminTeam`
- `setMyTeam`
- `setUserTeamAdmin`
- `getTeamContextById`

Current behavior:

- Active Unit/Team context is stored server-side in `user_active_contexts`.
- `OWNER` is treated as platform owner and may select any active Unit.
- Unit listing also includes compatibility fallbacks from `team_memberships` and legacy `team_members` so imported users do not see a blank Unit selector before memberships are fully normalized.
- Unit admins (`UNIT_OWNER`, `WORK_MANAGER`, `LOGISTICS_NCO`, `UNIT_ADMIN`) can access all active Teams inside their active Unit.
- Normal users must have explicit `team_memberships` rows to access a Team.
- Legacy `team_members` remains only as a compatibility bridge for older flows and imported data.

If implementing true multi-unit user membership, expect to change:

- `membership.functions.ts`
- Unit and Team selector UX.
- route guards/admin shell visibility checks.
- server functions that still rely on legacy `team_members`.

## Unit/tenant model

The app now uses a proper hierarchy:

```text
Unit
  └── Teams
        └── Team members/customers
```

Do not rename Teams to Units. Do not remove Teams. Do not treat Teams as the tenant boundary.

New migration:

- `supabase/migrations/20260711100000_units_team_memberships_foundation.sql`
- `supabase/migrations/20260711143000_unit_lifecycle_registration_faults.sql`

This migration adds:

- `units`
- `teams.unit_id`
- `unit_memberships`
- `team_memberships`
- `user_active_contexts`
- `team_products`
- `unit_id` compatibility columns on many existing operational tables
- `unit_team_integrity_issues` validation view

The lifecycle/registration/fault migration adds:

- `units.status`
- `units.setup_status`
- `units.deleted_at`
- `unit_registration_requests`
- `construction_faults`
- Owner-aware RLS helper/policies
- `unit_integrity_validation` validation view

Current unit-owned tables include or should include:

- `units`
- `unit_memberships`
- `teams` through `teams.unit_id`
- `team_memberships`
- `orders`
- `order_items` indirectly through `orders`
- `team_month_spent`
- `team_budget_alerts`
- `budget_policies`
- `budget_periods`
- `replacement_requests`
- `replacement_request_items` indirectly through `replacement_requests`
- `team_replacement_items`
- `team_replacement_item_history`
- `item_catalog_requests`
- `item_categories`
- `products`
- `replacement_products`

Older migration `supabase/migrations/20260710120000_unit_scoped_catalog_inventory.sql` incorrectly used `teams` as the unit boundary. It is retained for compatibility but should not guide future architecture.

The migration `supabase/migrations/20260711100000_units_team_memberships_foundation.sql` corrects the model and backfills existing Teams into an original Unit.

The older migration `supabase/migrations/20260710120000_unit_scoped_catalog_inventory.sql` added:

- `team_members.role`
- `team_members.is_active`
- `team_members.updated_at`
- `item_categories.team_id`
- `products.team_id`
- `replacement_products.team_id`
- team-aware unique indexes for category code and product item code
- team-aware catalog validation

When adding new business data tables, include `unit_id`. Add `team_id` only when the record belongs to a specific Team inside that Unit.

## Store/order domain

- `src/lib/team.functions.ts`

Team store is PIN-based rather than account-based. Important functions:

- `verifyTeamPin`
- `getShopData`
- `placeOrder`
- `repeatOrder`
- `getTeamOrders`
- `cancelOrder`
- `editOrder`

Current behavior:

- Team PIN resolves `teams.id`.
- `getShopData` fetches only products for that team via `products.team_id`.
- `placeOrder` validates products belong to that team.
- Orders store `team_id`.
- Stock is deducted from unit-owned `products.stock`.
- Budget check uses current team monthly/budget-period values and completed/current order totals.

When changing cart/order behavior, check:

- `src/routes/shop.index.tsx`
- `src/routes/shop.orders.tsx`
- `src/lib/team.functions.ts`
- `src/lib/cart-context.tsx`
- `src/components/bottom-tab-bar.tsx`

## Product and category admin

- `src/lib/admin.functions.ts`

Relevant product/category functions:

- `listProductsAdmin`
- `updateProductStock`
- `listItemCategoriesAdmin`
- `upsertItemCategory`
- `upsertProduct`
- `deleteProduct`
- `bulkImportProducts`

Current behavior after unit separation:

- Regular admin is scoped to their active `team_members.team_id`.
- Product/category reads are filtered by team for regular admins.
- Product/category writes attach `team_id`.
- Category/product mismatch is blocked.
- Owner/work-manager can see broadly and, for writes without membership, currently default to the first active team. This is safe but not ideal for a long-term multi-unit admin UX.

Future improvement:

- Add explicit “active admin unit” selection for owner/work-manager writes instead of defaulting to first active team.

## Admin dashboard and order management

- `src/lib/admin-dashboard.functions.ts`
- `src/lib/admin.functions.ts`
- `src/routes/admin.index.tsx`
- `src/routes/admin.orders.tsx`

Important functions:

- `getAdminDashboard`
- `listOrders`
- status update functions in `admin.functions.ts`

Current caution:

- Some dashboard KPI/low-stock summary code may still need deeper team scoping if owner/work-manager UX becomes unit-filtered.
- `listOrders` is now team-scoped for regular admins, but owner/work-manager can still filter or see broadly.

When changing order statuses, check stock restoration/deduction logic carefully.

## Replacement request and replacement inventory domain

### Team-facing replacement requests

- `src/lib/replacements.functions.ts`
- `src/routes/shop.replacements.tsx`

Main functions:

- `getReplacementShop`
- `submitReplacementRequest`
- `getTeamReplacementRequests`
- `deleteReplacementRequest`
- `editReplacementRequest`

Current behavior:

- Team PIN resolves `team.id`.
- Replacement products are filtered by `replacement_products.team_id`.
- Requests store `team_id`.
- `takin_stock` is deducted when request is submitted.

### Admin replacement inventory

- `src/lib/replacement-admin.functions.ts`
- `src/routes/admin.replacement-inventory.tsx`
- `src/routes/admin.replacements.tsx`

Main functions:

- `listReplacementProducts`
- `upsertReplacementProduct`
- `deleteReplacementProduct`
- `adjustReplacementStock`
- `bulkImportReplacementProducts`
- `listReplacementRequests`
- `updateReplacementStatus`

Current behavior after unit separation:

- Regular admin inventory reads/writes are scoped to their team.
- Replacement request list is scoped for regular admins.
- Owner/work-manager can still see/manage broader data.

Stock buckets:

- `takin_stock`: usable/working replacement stock.
- `balai_stock`: broken/returned/write-off stock.

## RASP / unit dashboard

- `src/lib/rasp-dashboard.functions.ts`
- `src/routes/shop.dashboard.tsx`

Purpose:

- Regular unit/RASP dashboard for held replacement items.
- Tracks who received an item, return dates, status, serials, attachments, and history.

Important functions:

- `getRaspDashboard`
- `createTeamReplacementItem`
- `returnTeamReplacementItem`
- additional update/undo/list helpers later in the file

Current behavior:

- Requires authenticated user with a valid team membership.
- Uses `team_members` to resolve the active team.
- Replacement product catalog is filtered by `replacement_products.team_id`.
- Created replacement-item records store `team_id` and `user_id`.

If the RASP screen disappears:

1. Check admin/store navigation visibility.
2. Check `admin-shell.tsx` and bottom-tab bars.
3. Check route exists: `src/routes/shop.dashboard.tsx`.
4. Check membership lookup in `rasp-dashboard.functions.ts`.
5. Check role/membership loading hooks.
6. Check tenant/team scoping errors from Supabase.

## Budget domain

- `src/lib/budget.functions.ts`
- `src/routes/admin.budgets.tsx`
- budget-related migrations:
  - `20260621120000_role_budget_audit_foundation.sql`
  - repair/schema migrations

Important concepts:

- `budget_policies`
- `budget_periods`
- `team_month_spent`
- allocated budget
- used/completed spend
- remaining available budget
- cart value included in remaining budget display

Store cart/budget pill behavior lives mainly in:

- `src/components/bottom-tab-bar.tsx`
- `src/lib/cart-context.tsx`
- `src/routes/shop.index.tsx`
- `src/lib/team.functions.ts`

Budget display requirement:

```text
Remaining budget = Total allocated budget - Previous approved/completed orders - Current cart total
```

When over budget:

- show how much over budget
- use a clear warning/error color
- do not display a confusing unexplained negative number
- order submission should be disabled when applicable

## Weekly calendar / missions

- `src/lib/missions.functions.ts`
- `src/lib/weekly-export.ts`
- `src/lib/workweek.ts`
- `src/routes/admin.calendar.tsx`

Features:

- Weekly work calendar.
- Mission planning and execution/signature workflow.
- PDF/export layout for Hebrew RTL weekly calendar.

Recent design requirements that matter:

- Export title: `תוכנית עבודה שבועית`
- Week label format: `שבוע 26`
- Subtitle format: `שבוע X חודש [month in Hebrew] - DD/MM/YYYY–DD/MM/YYYY - YYYY`
- Workdays only Sunday through Thursday; no Friday.
- Export should fit on one page.
- Table text should be centered in rows.
- Preserve RTL and Hebrew/numeric ordering.

When editing weekly export:

- Avoid completely replacing the structure.
- Keep the signature area.
- Render/preview the PDF/export if possible.
- Be careful with mixed Hebrew and numbers.

## Notifications and push

- `src/lib/admin-notifications.functions.ts`
- `src/lib/admin-push.server.ts`
- `src/lib/push.functions.ts`
- `src/lib/push.server.ts`
- `src/lib/push-client.ts`
- `src/components/push-toggle.tsx`
- `public/sw.js`

Event types are listed in `ADMIN_EVENT_TYPES` in `admin-notifications.functions.ts`.

Push uses VAPID keys. If push breaks on Vercel, check:

- Vercel env vars for VAPID public/private keys.
- service worker registration.
- browser permission state.
- admin notification preferences.
- `admin_push_subscriptions` / team push subscription tables.

## Admin personalization

- `src/lib/admin-preferences.functions.ts`
- `src/hooks/use-admin-preferences.ts`
- `src/routes/admin.preferences.tsx`
- `supabase/migrations/20260621090000_admin_personalization.sql`

Supports per-admin preferences such as default admin section and notification settings.

If adding more personalized admin controls, keep preferences user-specific and avoid global settings unless they are truly system-wide.

## Audit logs

- `src/lib/audit.functions.ts`
- `src/routes/admin.audit.tsx`
- role/budget/audit foundation migrations

Use audit logs for sensitive admin actions such as role changes, budget resets, and important workflow state changes.

## Auth/login flows

Supabase auth is used for authenticated admin/RASP flows. Team store flows also use PIN-based access.

Files to inspect for auth issues:

- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/client.server.ts`
- `src/integrations/supabase/auth-middleware.ts`
- `src/hooks/use-supabase-session.ts`
- `src/routes/admin.login.tsx`
- `src/routes/index.tsx`
- `src/lib/admin-auth.functions.ts`
- `src/lib/authz.server.ts`
- `src/lib/membership.functions.ts`

Common auth pitfalls seen during the Vercel transition:

- Wrong Supabase project URL in Vercel env vars.
- Google OAuth redirect URL pointing to localhost or a preview URL.
- Missing Google OAuth secret in Supabase provider settings.
- Different Supabase project from the one holding the imported tables.
- User exists in auth but lacks `profiles`, `user_roles`, or `team_members` rows.
- Role enum/table mismatch from partial SQL imports.

## Database migrations

Migrations live in `supabase/migrations`.

Important migration groups:

- Initial core tables:
  - `20260602175501_eacaa33d-852f-463c-9c58-17de89cee37d.sql`
- Replacement products/settings:
  - `20260604213926_102d14b8-63e9-455f-a459-9409af824d68.sql`
- Profiles/team members:
  - `20260616083114_2b0f9af6-23fa-417f-850b-4a45e3d8ab0b.sql`
- Admin personalization:
  - `20260621090000_admin_personalization.sql`
- Role/budget/audit foundation:
  - `20260621120000_role_budget_audit_foundation.sql`
- Repair missing schema:
  - `20260621150000_repair_missing_application_schema.sql`
- Calendar author approval workflow:
  - `20260621160000_calendar_author_approval_workflow.sql`
- RASP dashboard and controlled catalog:
  - `20260623110000_rasp_dashboard_and_controlled_catalog.sql`
- RASP replacement inventory only:
  - `20260627120000_rasp_replacement_inventory_only.sql`
- Unit-scoped catalog/inventory:
  - `20260710120000_unit_scoped_catalog_inventory.sql`

Migration safety rules:

- Prefer additive migrations.
- Do not edit old migrations unless rebuilding from scratch is explicitly intended.
- Use `IF NOT EXISTS` / `DROP ... IF EXISTS` where safe.
- Backfill existing data before setting `NOT NULL`.
- For tenant/unit data, include `team_id` and indexes.
- Validate cross-table team matches where possible.

## Generated/build files

Do not hand-edit:

- `src/routeTree.gen.ts`
- `.vercel/output/*`
- generated package/install artifacts unless deliberately updating dependencies

The route tree may be regenerated by the build/dev server.

## Styling and UX conventions

- App is Hebrew-first and RTL-sensitive.
- Use clear Hebrew wording and avoid mixed-direction bugs.
- Keep mobile layouts compact.
- Prefer existing UI components from `src/components/ui`.
- Keep admin and store navigation consistent.
- Preserve cart/budget information inside existing pills/buttons when requested; do not create duplicate floating widgets unless explicitly requested.
- Use Framer Motion/page transitions sparingly for smoother modern animation.

## Important recent branch context

Current clean multi-unit branch:

```text
agent/multitenant-from-ae82
```

This branch was created from older commit:

```text
ae82b9168f907898085f70c81f0e07b73876630d
```

Recent commit:

```text
b624482 Separate unit catalogs and inventory
```

That commit added the first safe layer of unit separation for products/categories/replacement inventory.

Follow-up role/unit-scope work added:

- A single active owner constraint through `20260710123000_single_owner_active_unit_scope.sql`.
- Hebrew role labels aligned to בעלים, מנהל עבודה, נגד לוגיסטיקה, and רס״פ.
- An admin-header active unit selector.
- Owner/admin operational data now requires a selected active unit instead of silently showing broad mixed data.

Latest multi-unit hardening added:

- `src/lib/authz.functions.ts` now treats active `unit_memberships` as the fallback authorization source when a user does not have an old global role. This lets `UNIT_OWNER`, `UNIT_ADMIN`, `WORK_MANAGER`, and `LOGISTICS_NCO` enter the correct admin surfaces without granting global `OWNER`.
- `src/lib/membership.functions.ts` now makes existing-Unit access requests idempotent:
  - one pending request per `user_id + unit_id`;
  - repeated clicks do not reset the original request time;
  - rejected requests have a 24-hour cooldown before resubmission;
  - Unit user managers can approve/reject requests for the active Unit only;
  - approval creates/updates `unit_memberships` and optional `team_memberships`;
  - request submission, duplicate-block, approval, rejection, team assignment, and team removal are audited when `audit_log` exists.
- `src/routes/select-team.tsx`, `src/components/bottom-tab-bar.tsx`, and `src/components/admin-shell.tsx` now perform real logout cleanup:
  - cancel active queries;
  - clear team session, admin acting state, cart/session storage, and cached data;
  - call Supabase `signOut`;
  - navigate back to `/` with replacement.
- Unit dashboard data is scoped in `src/lib/admin-dashboard.functions.ts` and `src/routes/admin.index.tsx` with query keys like `["unit", unitId, "admin-dashboard"]`. The dashboard also displays the active Unit name.
- Admin user/request screens in `src/routes/admin.users.tsx` use active-Unit query keys so users, Teams, and pending requests do not leak between selected Units.
- Order operations in `src/lib/admin.functions.ts` must verify the active Unit, not only the list:
  - `listOrders`
  - `getOrderDetail`
  - `updateAdminNotes`
  - `updateOrderStatus`
  - `updateOrderItems`
  - `deleteOrder`
  - `deleteOldOrders`
  Stock changes must verify `products.unit_id = activeUnitId`.
- `updateAdminUserRole` stores non-owner role changes in `unit_memberships`, blocks unauthorized Unit-role administration, prevents changing the final active `UNIT_OWNER`, and audits Unit-role changes.
- `setUserTeamAdmin` no longer downgrades an existing admin membership to `UNIT_USER` when assigning a Team. It preserves existing Unit roles and only creates `UNIT_USER` when the user had no Unit membership.
- Owner user deletion is handled by `deleteAdminUser` in `src/lib/admin.functions.ts` and exposed in `src/routes/admin.users.tsx`. It is owner-only, blocks deleting yourself, blocks deleting the platform `OWNER`, blocks deleting the final active `UNIT_OWNER` of any Unit, revokes global/Unit/Team access, cancels pending access requests, hides the user from active app lists, and attempts Supabase Auth deletion. If Auth deletion is blocked by historical FK records, the function falls back to banning/deactivating the user so they cannot log in.
- `supabase/migrations/20260711190000_unit_integrity_repair_and_constraints.sql` repairs non-null mismatched `unit_id` values, assigns approved Unit creators as `UNIT_OWNER`, cancels duplicate pending Unit-registration requests while preserving the earliest pending row, adds duplicate-prevention indexes, adds `UNIT_ADMIN` to the access-request role check, enforces `team_memberships.unit_id = teams.unit_id`, prevents removal of the final active `UNIT_OWNER`, and creates `public.unit_integrity_validation`.
- `supabase/migrations/20260711193000_repair_missing_unit_owners.sql` handles the validation case where a Unit still has no active `UNIT_OWNER`: the `ORIGINAL` Unit receives the active global `OWNER`, and any other Unit without an owner promotes its strongest existing active admin-like Unit membership to `UNIT_OWNER`. Units with no candidate intentionally remain in `public.unit_integrity_validation` for manual assignment.

After running the latest migration in Supabase, check:

```sql
select * from public.unit_integrity_validation;
```

The result should be empty. If rows remain, inspect them before assuming the migration fully repaired production data.

## Known gaps / future architecture work

These are intentionally not fully solved yet:

1. True multi-membership support for one user belonging to multiple units.
   - Current `team_members` legacy shape is still effectively one active team per user.
   - Needs schema + UX + server-function changes.

2. Full multi-membership active-unit switcher.
   - A basic active-unit selector exists in the admin header.
   - It currently changes the user's single `team_members` row.
   - Future UX should allow one owner/admin account to belong to multiple units without overwriting membership history.

3. Dashboard KPI scoping.
   - Regular admin views are being scoped.
   - Owner/admin dashboard should eventually show a clear selected-unit mode and, where useful, an explicit all-units overview.

4. Full tenant isolation test suite.
   - Build passes, but dedicated tenant-isolation tests should be added.

5. Supabase RLS hardening.
   - Many server functions use service-role access for simplicity.
   - App-level scoping exists, but RLS policies should be reviewed and strengthened.

6. Mission/calendar tenant scoping.
   - Some mission/calendar tables may need deeper `team_id` enforcement depending on the final multi-unit model.

## Quick investigation checklist

Before changing code:

1. Identify the route in `src/routes`.
2. Identify the server function in `src/lib`.
3. Identify the Supabase tables/migrations involved.
4. Check role requirements in `authz.server.ts`.
5. Check team/unit scoping:
   - Is there a `team_id`?
   - Is it filtered on read?
   - Is it attached on insert?
   - Is it protected on update/delete?
6. Check admin navigation visibility in `admin-shell.tsx`.
7. Check mobile/store navigation in bottom tab bars.
8. Run build after changes.

## Common commands for future agents

Check status:

```powershell
git status --short --branch
```

Search fast:

```powershell
rg "search term"
rg --files
```

Build:

```powershell
pnpm run build
```

If using Codex bundled runtime:

```powershell
$env:PATH='C:\Users\david\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:PATH
& 'C:\Users\david\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd' run build
```

## Mandatory prompt for future agents

Before you finish any future code change in this repository, update this file if your change affects architecture, routes, database tables, migrations, authorization, unit/team scoping, admin/store workflows, deployment, environment variables, or important troubleshooting steps.

Use this exact reminder as part of your final self-check:

```text
CODEBASE_GUIDE.md update check:
- Did I add, remove, rename, or materially change any route, server function, table, migration, role, permission rule, environment variable, deployment behavior, or major workflow?
- If yes, update CODEBASE_GUIDE.md in the same commit with the relevant new information.
- If no, state that no guide update was needed.
```

Do not leave this guide stale. It exists so the next agent can work faster and safer.
