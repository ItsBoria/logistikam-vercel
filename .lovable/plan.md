## Goal
Each user's team is locked after first pick. Admins can assign/change the team from **כל המשתמשים**.

## Changes

### 1. Backend — `src/lib/membership.functions.ts`
- **Lock `setMyTeam` (self-service)**: if the user already has a row in `team_members`, throw "הצוות שלך כבר נקבע — פנה למנהל לשינוי". Insert only when there is no existing membership (no upsert-replace).
- **Add `setUserTeamAdmin`** server fn (admin-only):
  - Input: `{ user_id: uuid, team_id: uuid | null }`.
  - Verifies caller has `admin` role.
  - If `team_id` is null → delete the user's `team_members` row.
  - Else validate team exists + active, then upsert `team_members` on `user_id`.

### 2. Backend — `src/lib/admin.functions.ts`
- **`searchRegisteredUsers`** also returns `team_id` and `team_name` per user (joined from `team_members` + `teams`).
- **`listAdminUsers`** (system users tab): include the same team info so admins/staff also show their team.

### 3. Frontend — `src/routes/admin.users.tsx`
- **כל המשתמשים** rows: add a **team Select** next to the role Select.
  - Options: all active teams (incl. admin-only) + a "ללא צוות" option.
  - Shows current team as the selected value; changing it calls `setUserTeamAdmin`.
- Loads team list once via `listActiveTeams` (admin sees all).
- Same team Select shown in the **משתמשי מערכת** tab rows.
- Invalidate `["registered-users"]` and `["admin-users"]` after a change.

## Out of scope
- No schema change. `team_members` already enforces one team per user via PK / unique on `user_id`.
- No change to admin "view shop as" or PIN flow.

## Result
A new user picks a team once on first entry. From then on the choice is fixed for them; only an admin can move them to another team (or detach them) from the users page.
