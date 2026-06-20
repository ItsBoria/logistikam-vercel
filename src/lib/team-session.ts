// Per-tab team context for the shop. Populated from auth-derived data
// (and from the admin "view shop as" picker) rather than from a PIN entry.
const KEY = "team_session_v1";
const ADMIN_ACTING_KEY = "admin_acting_team_v1";

export type TeamSession = {
  team_id: string;
  team_name: string;
  pin: string;
  monthly_limit: number;
  contact_phone: string | null;
};

export function getTeamSession(): TeamSession | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}
export function setTeamSession(s: TeamSession | null) {
  if (typeof window === "undefined") return;
  if (s) localStorage.setItem(KEY, JSON.stringify(s));
  else localStorage.removeItem(KEY);
  try { window.dispatchEvent(new Event("team-session-changed")); } catch {}
}

// Admin-only: flag that the current team session is a "view as" override.
export function setAdminActing(active: boolean) {
  if (typeof window === "undefined") return;
  if (active) localStorage.setItem(ADMIN_ACTING_KEY, "1");
  else localStorage.removeItem(ADMIN_ACTING_KEY);
}
export function isAdminActing(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_ACTING_KEY) === "1";
}
