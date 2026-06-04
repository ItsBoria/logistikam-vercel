# Admin Login Recovery + Better Admin Creation

## Goal

1. Let you log in right now using your existing admin email (`davidpanasik@hotmail.com`) + password.
2. When creating a new admin, collect **email + username + password** (not just username).

## Changes

### 1. Login form accepts email OR username
`src/routes/admin.login.tsx`
- Single field labeled "שם משתמש או אימייל".
- Submit calls a new `signInWithUsernameOrEmail(identifier, password)`.

`src/lib/admin-auth.functions.ts`
- New server fn: if identifier contains `@` → sign in directly with it as email.
- Otherwise → look up the user by username (synthetic `username@admins.local`) and sign in.
- Keeps the existing username path working; restores access for legacy email-based admins immediately.

### 2. Admin creation collects email + username + password
`src/routes/admin.users.tsx` (existing admin users page)
- "Add admin" form now has three fields: **Email**, **Username**, **Password**.
- Validation: email format, username `[a-z0-9_]{3,32}`, password ≥ 8 chars, both email and username unique.

`src/lib/admin-auth.functions.ts`
- Update `createAdminUser({ email, username, password })`:
  - Creates the auth user with the real email (so password reset / email login works).
  - Stores `username` in `auth.users.user_metadata.username`.
  - Grants `admin` role in `public.user_roles`.

### 3. Username lookup
Login-by-username needs to resolve username → user id without exposing user data.
- Server fn uses `supabaseAdmin.auth.admin.listUsers()` filtered by `user_metadata.username` (server-only, behind admin login form — safe).
- No new table needed; no schema migration required.

## Out of scope
- No changes to team/shop flows.
- No password reset UI (can be added later if needed).

## After this ships
You log in immediately with `davidpanasik@hotmail.com` + your existing password, then go to **Admin → משתמשים** to add new admins with email + username + password.
