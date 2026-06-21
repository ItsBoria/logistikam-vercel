import { c as createServerRpc } from "./createServerRpc-Cb-gMCu4.mjs";
import { a as createServerFn } from "./server-CIKTFqrt.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DIPMndrz.mjs";
import "../_libs/react.mjs";
import "node:async_hooks";
import "node:stream";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "node:stream/web";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
async function assertAdmin(ctx) {
  const {
    data,
    error
  } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin"
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}
async function isApprover(ctx) {
  const {
    data
  } = await ctx.supabase.rpc("is_approver", {
    _user_id: ctx.userId
  });
  return !!data;
}
const listCalendarAdmins_createServerFn_handler = createServerRpc({
  id: "eb5db522c41e23e0293ccb4246d723a57342303f1b782efcdd25e48d7c8c6348",
  name: "listCalendarAdmins",
  filename: "src/lib/missions.functions.ts"
}, (opts) => listCalendarAdmins.__executeServer(opts));
const listCalendarAdmins = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(listCalendarAdmins_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: roles
  } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
  const ids = (roles ?? []).map((r) => r.user_id);
  if (!ids.length) return [];
  const {
    data: profs
  } = await supabaseAdmin.from("profiles").select("id, display_name, email, is_approver").in("id", ids);
  return (profs ?? []).map((p) => ({
    id: p.id,
    name: p.display_name || p.email || p.id.slice(0, 8),
    is_approver: !!p.is_approver
  }));
});
const setAdminApprover_createServerFn_handler = createServerRpc({
  id: "1bbf4378a94b7417d111929d2d7485ad60792577b2b7ab21348058c79acf6e10",
  name: "setAdminApprover",
  filename: "src/lib/missions.functions.ts"
}, (opts) => setAdminApprover.__executeServer(opts));
const setAdminApprover = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(setAdminApprover_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    error
  } = await supabaseAdmin.from("profiles").update({
    is_approver: data.is_approver
  }).eq("id", data.user_id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const getMissionWeek_createServerFn_handler = createServerRpc({
  id: "db98f2190d31cc35f97945a7055400becf63ce3176b8d1c0d5f850357a02f1c6",
  name: "getMissionWeek",
  filename: "src/lib/missions.functions.ts"
}, (opts) => getMissionWeek.__executeServer(opts));
const getMissionWeek = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(getMissionWeek_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context);
  const {
    supabase,
    userId
  } = context;
  const owner = data.owner_user_id ?? userId;
  const isOwner = owner === userId;
  const approver = await isApprover(context);
  let {
    data: weekRow,
    error: selErr
  } = await supabase.from("mission_weeks").select("*").eq("year", data.year).eq("week", data.week).eq("owner_user_id", owner).maybeSingle();
  if (selErr) throw new Error(selErr.message);
  if (!weekRow) {
    if (!isOwner) {
      return {
        week: null,
        missions: [],
        day_notes: [],
        can_edit: false,
        can_sign_author: false,
        can_sign_approver: approver,
        is_owner: false
      };
    }
    const {
      data: prof
    } = await supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle();
    const ins = await supabase.from("mission_weeks").insert({
      year: data.year,
      week: data.week,
      owner_user_id: userId,
      created_by: userId,
      created_by_name: prof?.display_name ?? null
    }).select("*").single();
    if (ins.error) throw new Error(ins.error.message);
    weekRow = ins.data;
  }
  const [{
    data: missions,
    error: mErr
  }, {
    data: notes,
    error: nErr
  }] = await Promise.all([supabase.from("missions").select("*").eq("week_id", weekRow.id).order("day_of_week", {
    ascending: true
  }).order("position", {
    ascending: true
  }).order("created_at", {
    ascending: true
  }), supabase.from("mission_day_notes").select("*").eq("week_id", weekRow.id)]);
  if (mErr) throw new Error(mErr.message);
  if (nErr) throw new Error(nErr.message);
  return {
    week: weekRow,
    missions: missions ?? [],
    day_notes: notes ?? [],
    can_edit: isOwner && !weekRow.locked,
    can_sign_author: isOwner && !weekRow.author_signed_at,
    can_sign_approver: approver && !weekRow.approver_signed_at,
    is_owner: isOwner
  };
});
async function assertOwner(ctx, week_id) {
  const {
    data: w
  } = await ctx.supabase.from("mission_weeks").select("owner_user_id, locked, year, week").eq("id", week_id).maybeSingle();
  if (!w) throw new Error("שבוע לא נמצא");
  if (w.owner_user_id !== ctx.userId) throw new Error("רק בעל הלוח יכול לערוך");
  if (w.locked) throw new Error("השבוע נעול — לא ניתן לערוך");
  return w;
}
const upsertMission_createServerFn_handler = createServerRpc({
  id: "a5ed5c58f2d3155e4cd1c6941c19d04a98b1d40d76925ebb07b9e989809f91e5",
  name: "upsertMission",
  filename: "src/lib/missions.functions.ts"
}, (opts) => upsertMission.__executeServer(opts));
const upsertMission = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(upsertMission_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context);
  const {
    supabase
  } = context;
  await assertOwner(context, data.week_id);
  const patch = {
    title: data.title,
    details: data.details ?? null,
    day_of_week: data.day_of_week,
    due_time: data.due_time ?? null,
    reminder_at: data.reminder_at ?? null
  };
  if (data.id) {
    const {
      error: error2
    } = await supabase.from("missions").update(patch).eq("id", data.id);
    if (error2) throw new Error(error2.message);
    return {
      ok: true
    };
  }
  const {
    data: existing
  } = await supabase.from("missions").select("position").eq("week_id", data.week_id).eq("day_of_week", data.day_of_week).order("position", {
    ascending: false
  }).limit(1);
  const nextPos = existing && existing[0] ? (existing[0].position ?? 0) + 1 : 0;
  const {
    error
  } = await supabase.from("missions").insert({
    week_id: data.week_id,
    position: nextPos,
    ...patch
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const deleteMission_createServerFn_handler = createServerRpc({
  id: "d5c24608b724b4a16bd4b2ba1a9924d97e24980a72438cc34c272fce6ee3f3b8",
  name: "deleteMission",
  filename: "src/lib/missions.functions.ts"
}, (opts) => deleteMission.__executeServer(opts));
const deleteMission = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(deleteMission_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context);
  const {
    supabase
  } = context;
  const {
    data: row
  } = await supabase.from("missions").select("week_id").eq("id", data.id).maybeSingle();
  if (!row) return {
    ok: true
  };
  await assertOwner(context, row.week_id);
  const {
    error
  } = await supabase.from("missions").delete().eq("id", data.id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const toggleMissionDone_createServerFn_handler = createServerRpc({
  id: "3e9a621029a7b4fa40813a191b9fd6a5db90bb0cd9bfa58e750c656ad7fbfd6b",
  name: "toggleMissionDone",
  filename: "src/lib/missions.functions.ts"
}, (opts) => toggleMissionDone.__executeServer(opts));
const toggleMissionDone = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(toggleMissionDone_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context);
  const {
    supabase
  } = context;
  const {
    data: row
  } = await supabase.from("missions").select("week_id").eq("id", data.id).maybeSingle();
  if (!row) return {
    ok: true
  };
  await assertOwner(context, row.week_id);
  const {
    error
  } = await supabase.from("missions").update({
    done: data.done
  }).eq("id", data.id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const updateWeekNotes_createServerFn_handler = createServerRpc({
  id: "62ed565fe2cf94948845909d84aefc82559dd325ac0787d8973e9512f43cfebc",
  name: "updateWeekNotes",
  filename: "src/lib/missions.functions.ts"
}, (opts) => updateWeekNotes.__executeServer(opts));
const updateWeekNotes = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(updateWeekNotes_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context);
  await assertOwner(context, data.week_id);
  const {
    error
  } = await context.supabase.from("mission_weeks").update({
    notes: data.notes
  }).eq("id", data.week_id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const upsertDayNote_createServerFn_handler = createServerRpc({
  id: "b371f2820743202066a418d7d2e4dbaf3a7422e89835a1753bd95b1426b3fd09",
  name: "upsertDayNote",
  filename: "src/lib/missions.functions.ts"
}, (opts) => upsertDayNote.__executeServer(opts));
const upsertDayNote = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(upsertDayNote_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context);
  await assertOwner(context, data.week_id);
  const {
    error
  } = await context.supabase.from("mission_day_notes").upsert({
    week_id: data.week_id,
    day_of_week: data.day_of_week,
    influencers: data.influencers
  }, {
    onConflict: "week_id,day_of_week"
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const signMissionWeek_createServerFn_handler = createServerRpc({
  id: "db8b8fad7cf4865e13f446bc7ebff0e8bd7ff102d85ba7a504a8a05f55c7c7c6",
  name: "signMissionWeek",
  filename: "src/lib/missions.functions.ts"
}, (opts) => signMissionWeek.__executeServer(opts));
const signMissionWeek = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(signMissionWeek_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context);
  const {
    supabase,
    userId
  } = context;
  const name = data.signature_name.trim();
  if (!name) throw new Error("נדרש שם");
  const {
    data: w
  } = await supabase.from("mission_weeks").select("owner_user_id, author_signed_at, approver_signed_at").eq("id", data.week_id).maybeSingle();
  if (!w) throw new Error("שבוע לא נמצא");
  const patch = {};
  if (data.role === "author") {
    if (w.owner_user_id !== userId) throw new Error("רק בעל הלוח חותם כרכז");
    patch.author_signed_at = (/* @__PURE__ */ new Date()).toISOString();
    patch.author_signature_name = name;
  } else {
    if (!await isApprover(context)) throw new Error("רק מנהל מאשר יכול לחתום");
    patch.approver_signed_at = (/* @__PURE__ */ new Date()).toISOString();
    patch.approver_signature_name = name;
    patch.approver_user_id = userId;
  }
  const {
    data: updated,
    error
  } = await supabase.from("mission_weeks").update(patch).eq("id", data.week_id).select("author_signed_at, approver_signed_at").single();
  if (error) throw new Error(error.message);
  if (updated.author_signed_at && updated.approver_signed_at) {
    await supabase.from("mission_weeks").update({
      locked: true
    }).eq("id", data.week_id);
  }
  return {
    ok: true
  };
});
const reopenMissionWeek_createServerFn_handler = createServerRpc({
  id: "d77cfd6de4b2bb960bd327b009d81f5561c4db8aa0cbfca5e1d58ed5bfc7da58",
  name: "reopenMissionWeek",
  filename: "src/lib/missions.functions.ts"
}, (opts) => reopenMissionWeek.__executeServer(opts));
const reopenMissionWeek = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(reopenMissionWeek_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context);
  const {
    supabase,
    userId
  } = context;
  const {
    data: w
  } = await supabase.from("mission_weeks").select("owner_user_id").eq("id", data.week_id).maybeSingle();
  if (!w) throw new Error("שבוע לא נמצא");
  const approver = await isApprover(context);
  if (w.owner_user_id !== userId && !approver) throw new Error("רק הבעלים או מאשר יכול לפתוח מחדש");
  const {
    error
  } = await supabase.from("mission_weeks").update({
    locked: false,
    author_signed_at: null,
    author_signature_name: null,
    approver_signed_at: null,
    approver_signature_name: null,
    approver_user_id: null
  }).eq("id", data.week_id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
function nextIsoWeek(year, week) {
  const simple = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = simple.getUTCDay() || 7;
  const isoMon = new Date(simple);
  isoMon.setUTCDate(simple.getUTCDate() - (dayOfWeek - 1) + (week - 1) * 7);
  const nextMon = new Date(isoMon);
  nextMon.setUTCDate(isoMon.getUTCDate() + 7);
  const d = new Date(Date.UTC(nextMon.getUTCFullYear(), nextMon.getUTCMonth(), nextMon.getUTCDate()));
  const dn = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dn);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const wk = Math.ceil(((d.getTime() - yearStart.getTime()) / 864e5 + 1) / 7);
  return {
    year: d.getUTCFullYear(),
    week: wk
  };
}
const carryUnfinishedToNextWeek_createServerFn_handler = createServerRpc({
  id: "9fe50af1be0f1ef10757123f076faf991476a92e31a9dca59697722b888ea8a8",
  name: "carryUnfinishedToNextWeek",
  filename: "src/lib/missions.functions.ts"
}, (opts) => carryUnfinishedToNextWeek.__executeServer(opts));
const carryUnfinishedToNextWeek = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(carryUnfinishedToNextWeek_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context);
  const {
    supabase,
    userId
  } = context;
  const w = await assertOwner(context, data.week_id);
  const {
    data: unfinished,
    error: uErr
  } = await supabase.from("missions").select("*").eq("week_id", data.week_id).eq("done", false);
  if (uErr) throw new Error(uErr.message);
  if (!unfinished || !unfinished.length) return {
    ok: true,
    moved: 0
  };
  const next = nextIsoWeek(w.year, w.week);
  let {
    data: nextWeek
  } = await supabase.from("mission_weeks").select("*").eq("year", next.year).eq("week", next.week).eq("owner_user_id", userId).maybeSingle();
  if (!nextWeek) {
    const {
      data: prof
    } = await supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle();
    const ins = await supabase.from("mission_weeks").insert({
      year: next.year,
      week: next.week,
      owner_user_id: userId,
      created_by: userId,
      created_by_name: prof?.display_name ?? null
    }).select("*").single();
    if (ins.error) throw new Error(ins.error.message);
    nextWeek = ins.data;
  }
  if (nextWeek.locked) throw new Error("שבוע היעד נעול");
  const inserts = unfinished.map((m, i) => ({
    week_id: nextWeek.id,
    day_of_week: 0,
    // start of next week
    position: i,
    title: m.title,
    details: m.details,
    due_time: m.due_time,
    reminder_at: null,
    carried_from_id: m.id
  }));
  const {
    error: insErr
  } = await supabase.from("missions").insert(inserts);
  if (insErr) throw new Error(insErr.message);
  return {
    ok: true,
    moved: inserts.length,
    target: next
  };
});
export {
  carryUnfinishedToNextWeek_createServerFn_handler,
  deleteMission_createServerFn_handler,
  getMissionWeek_createServerFn_handler,
  listCalendarAdmins_createServerFn_handler,
  reopenMissionWeek_createServerFn_handler,
  setAdminApprover_createServerFn_handler,
  signMissionWeek_createServerFn_handler,
  toggleMissionDone_createServerFn_handler,
  updateWeekNotes_createServerFn_handler,
  upsertDayNote_createServerFn_handler,
  upsertMission_createServerFn_handler
};
