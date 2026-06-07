## Goal
Fix the admin login flow so that after a successful sign-in, admins are actually taken into the admin panel instead of getting stuck on the welcome screen.

## What I’ll change

### 1. Stop the global auth loop
Update the root auth listener so it only reacts to real auth changes (`SIGNED_IN`, `SIGNED_OUT`, `USER_UPDATED`) instead of every auth event. This should stop the repeated history replacements that are blocking navigation.

### 2. Remove duplicate post-login navigation
Adjust the login page so it does not try to navigate to the admin area twice:
- once immediately after password sign-in
- again when roles finish loading

I’ll keep a single redirect path based on the user’s role.

### 3. Use one consistent role-loading path
Make the home/login route use the existing `useAdminRoles()` hook instead of running a second separate role query with different cache timing. This should stabilize the redirect and avoid re-triggering the route logic.

## Expected result
- Admin login shows the welcome message and then opens `/admin`
- Staff login opens their allowed admin/staff page
- No endless redirect loop in the browser
- No `replaceState` spam in the console

## Technical notes
Files likely involved:
- `src/routes/__root.tsx`
- `src/routes/index.tsx`
- `src/hooks/use-admin-roles.ts`

I already verified this is not a missing-role issue: the recent admin accounts do have `admin` roles in the database.