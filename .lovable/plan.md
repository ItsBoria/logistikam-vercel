# Plan

## 1. Enable Google signups
Flip auth backend settings so new Google users can be created:
- `disable_signup: false`
- `auto_confirm_email: false` (unchanged)
- `external_anonymous_users_enabled: false` (unchanged)
- `password_hibp_enabled: true` (unchanged)

No code changes — this unblocks the "failed to sign in with vendor" error.

## 2. Redesign admin shell — minimal, bottom-only nav

### `src/components/admin-shell.tsx`
- Remove the top desktop nav row and the mobile horizontal scroll-strip of tabs.
- Keep a slim top bar with only:
  - Small brand mark (left)
  - "View shop as team…" picker (admin only, right)
  - Sign-out icon button (right)
- No labels, no extra chrome. Generous padding, subtle border.
- Main content area gets bottom padding so the floating tab bar never overlaps.

### `src/components/admin-bottom-tab-bar.tsx`
- Always-visible floating pill bar, centered, max-w ~640px, 16px from bottom, backdrop blur.
- Admin tabs reduced to essentials: **Overview, Orders, Products, Stock, Teams, More**.
  - "More" opens a bottom sheet containing the remaining items (Replacements, Reports, Settings, etc.).
- Staff keeps its existing 4 items.
- Active tab: solid `bg-primary` pill with icon + label.
- Inactive: icon-only; label appears on hover (desktop) and is always shown on mobile under the icon at smaller size.
- Pending-orders count badge on the Orders tab (reuse existing query).

### Dashboard cleanup
- Remove the small floating quick-actions widget that duplicates nav — the bottom bar is the single nav surface.

## Out of scope
- No changes to inner admin page content/layout.
- No color/theme overhaul; uses existing tokens.

## Technical notes
- Pending-orders badge: reuse the existing orders query already used in admin overview; pass count into the bottom bar via prop or a small shared hook.
- Bottom sheet: shadcn `Sheet` with `side="bottom"`.
- Keep route-active detection via `useRouterState`.
