import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Message, Thread, ThreadKind } from "@/components/messaging/types";

// ---------------------------------------------------------------------------
// Types mirroring the DB rows
// ---------------------------------------------------------------------------

export type DbThreadKind = "admin_support" | "company_candidate";

interface DbThreadRow {
  id: string;
  kind: DbThreadKind;
  user_id: string | null;
  company_user_id: string | null;
  talent_user_id: string | null;
  subject: string | null;
  created_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_sender_user_id: string | null;
  last_sender_is_admin: boolean;
}

interface DbMessageRow {
  id: string;
  thread_id: string;
  sender_user_id: string | null;
  sender_is_admin: boolean;
  body: string;
  system: boolean;
  created_at: string;
}

interface DbThreadReadRow {
  thread_id: string;
  user_id: string;
  last_read_at: string;
}

// ---------------------------------------------------------------------------
// Counterparty resolution
// ---------------------------------------------------------------------------

interface CounterpartyInfo {
  name: string;
  subtitle: string | null;
  initials: string;
  avatarUrl: string | null;
}

interface UserLite {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: "talent" | "company" | null;
}

interface CompanyLite {
  user_id: string;
  legal_name: string | null;
}

interface TalentLite {
  user_id: string;
  headline: string | null;
  location: string | null;
}

function initialsFrom(name: string | null | undefined, fallback = "?"): string {
  const n = (name ?? "").trim();
  if (!n) return fallback;
  const parts = n.split(/\s+/).slice(0, 2);
  const letters = parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return letters || fallback;
}

// ---------------------------------------------------------------------------
// Server-side helpers
// ---------------------------------------------------------------------------

/**
 * Hydrate a set of threads into the shape the UI expects. Pulls the
 * counterparty profile info, messages, and the viewer's last_read_at, and
 * computes an unread count per thread.
 *
 * Uses the service-role client internally (read-only selects) because we need
 * to look at auth.users / profiles of the *other* participant, which the
 * viewer's own RLS wouldn't allow. The caller is responsible for gating
 * access (only showing threads the viewer actually owns).
 */
async function hydrateThreads(params: {
  viewerUserId: string;
  viewerIsAdmin: boolean;
  rows: DbThreadRow[];
}): Promise<Thread[]> {
  const { viewerUserId, viewerIsAdmin, rows } = params;
  if (rows.length === 0) return [];

  const admin = createAdminClient();

  // 1) Collect the set of "counterparty" user ids to look up, i.e. every
  //    participant that *isn't* the viewer.
  const otherIds = new Set<string>();
  for (const t of rows) {
    if (t.kind === "admin_support") {
      if (viewerIsAdmin) {
        if (t.user_id) otherIds.add(t.user_id);
      }
      // If viewer is the supported user, the counterparty is "Veloraa"
      // itself — no DB lookup needed.
    } else {
      if (t.company_user_id && t.company_user_id !== viewerUserId)
        otherIds.add(t.company_user_id);
      if (t.talent_user_id && t.talent_user_id !== viewerUserId)
        otherIds.add(t.talent_user_id);
    }
  }

  const [profilesRes, companiesRes, talentsRes, messagesRes, readsRes] =
    await Promise.all([
      otherIds.size > 0
        ? admin
            .from("profiles")
            .select("id, email, full_name, avatar_url, role")
            .in("id", Array.from(otherIds))
        : Promise.resolve({ data: [] as UserLite[], error: null }),
      otherIds.size > 0
        ? admin
            .from("company_applications")
            .select("user_id, legal_name")
            .in("user_id", Array.from(otherIds))
        : Promise.resolve({ data: [] as CompanyLite[], error: null }),
      otherIds.size > 0
        ? admin
            .from("talent_applications")
            .select("user_id, headline, location")
            .in("user_id", Array.from(otherIds))
        : Promise.resolve({ data: [] as TalentLite[], error: null }),
      admin
        .from("messages")
        .select("*")
        .in(
          "thread_id",
          rows.map((t) => t.id)
        )
        .order("created_at", { ascending: true }),
      admin
        .from("thread_reads")
        .select("*")
        .eq("user_id", viewerUserId)
        .in(
          "thread_id",
          rows.map((t) => t.id)
        ),
    ]);

  const profileById = new Map<string, UserLite>();
  for (const p of (profilesRes.data as UserLite[] | null) ?? []) {
    profileById.set(p.id, p);
  }
  const companyByUserId = new Map<string, CompanyLite>();
  for (const c of (companiesRes.data as CompanyLite[] | null) ?? []) {
    companyByUserId.set(c.user_id, c);
  }
  const talentByUserId = new Map<string, TalentLite>();
  for (const t of (talentsRes.data as TalentLite[] | null) ?? []) {
    talentByUserId.set(t.user_id, t);
  }

  const messagesByThread = new Map<string, DbMessageRow[]>();
  for (const m of (messagesRes.data as DbMessageRow[] | null) ?? []) {
    const list = messagesByThread.get(m.thread_id) ?? [];
    list.push(m);
    messagesByThread.set(m.thread_id, list);
  }

  const readByThread = new Map<string, string>(); // thread_id → last_read_at ISO
  for (const r of (readsRes.data as DbThreadReadRow[] | null) ?? []) {
    readByThread.set(r.thread_id, r.last_read_at);
  }

  // 2) Materialize UI threads.
  const out: Thread[] = rows.map((row) => {
    const other = resolveCounterparty({
      row,
      viewerUserId,
      viewerIsAdmin,
      profileById,
      companyByUserId,
      talentByUserId,
    });

    const uiKind: ThreadKind = mapKind(row, viewerIsAdmin);

    const rawMsgs = messagesByThread.get(row.id) ?? [];
    const lastReadAt = readByThread.get(row.id) ?? null;

    let unread = 0;
    const messages: Message[] = rawMsgs.map((m): Message => {
      const fromSelf = m.system
        ? false
        : viewerIsAdmin
          ? !!m.sender_is_admin
          : m.sender_user_id === viewerUserId;
      if (
        !m.system &&
        !fromSelf &&
        (!lastReadAt || new Date(m.created_at) > new Date(lastReadAt))
      ) {
        unread++;
      }
      return {
        id: m.id,
        body: m.body,
        at: m.created_at,
        fromSelf,
        system: m.system || undefined,
      };
    });

    return {
      id: row.id,
      name: other.name,
      subtitle: other.subtitle,
      avatarInitials: other.initials,
      avatarUrl: other.avatarUrl,
      kind: uiKind,
      pinned: uiKind === "admin",
      unread,
      lastMessage: row.last_message_preview ?? undefined,
      lastMessageAt: row.last_message_at ?? row.created_at,
      messages,
      talentUserId: row.talent_user_id ?? null,
      companyUserId: row.company_user_id ?? null,
    };
  });

  // Admin threads float to the top, then most recent wins.
  out.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bt - at;
  });

  return out;
}

function mapKind(row: DbThreadRow, viewerIsAdmin: boolean): ThreadKind {
  if (row.kind === "admin_support") {
    // Admin viewing an admin_support thread: the thread is "a user" (company
    // or talent) on the other side. Surface its true kind so the UI renders a
    // non-admin avatar.
    if (viewerIsAdmin) {
      // Defer the specific classification to the resolver which reads profile
      // role. Here we return a reasonable default; the resolver overrides
      // `kind` via the returned Thread shape in its own code path.
      return "candidate";
    }
    return "admin";
  }
  return "candidate";
}

function resolveCounterparty(params: {
  row: DbThreadRow;
  viewerUserId: string;
  viewerIsAdmin: boolean;
  profileById: Map<string, UserLite>;
  companyByUserId: Map<string, CompanyLite>;
  talentByUserId: Map<string, TalentLite>;
}): CounterpartyInfo {
  const {
    row,
    viewerUserId,
    viewerIsAdmin,
    profileById,
    companyByUserId,
    talentByUserId,
  } = params;

  if (row.kind === "admin_support") {
    if (!viewerIsAdmin) {
      return {
        name: "Veloraa Team",
        subtitle: "Your onboarding & support team",
        initials: "V",
        avatarUrl: null,
      };
    }
    // Admin viewing — counterparty is the supported user.
    const uid = row.user_id;
    if (!uid) {
      return { name: "Unknown user", subtitle: null, initials: "?", avatarUrl: null };
    }
    return userSummary(uid, profileById, companyByUserId, talentByUserId);
  }

  // company_candidate
  const otherId =
    row.company_user_id && row.company_user_id !== viewerUserId
      ? row.company_user_id
      : row.talent_user_id;
  if (!otherId) {
    return { name: "Conversation", subtitle: null, initials: "?", avatarUrl: null };
  }
  return userSummary(otherId, profileById, companyByUserId, talentByUserId);
}

function userSummary(
  uid: string,
  profileById: Map<string, UserLite>,
  companyByUserId: Map<string, CompanyLite>,
  talentByUserId: Map<string, TalentLite>
): CounterpartyInfo {
  const profile = profileById.get(uid);
  const company = companyByUserId.get(uid);
  const talent = talentByUserId.get(uid);

  if (profile?.role === "company") {
    const name =
      company?.legal_name?.trim() ||
      profile.full_name?.trim() ||
      profile.email ||
      "Company";
    return {
      name,
      subtitle: profile.email ?? null,
      initials: initialsFrom(name, "C"),
      avatarUrl: profile.avatar_url ?? null,
    };
  }

  if (profile?.role === "talent") {
    const name = profile.full_name?.trim() || profile.email || "Candidate";
    const subtitle =
      talent?.headline?.trim() ||
      talent?.location?.trim() ||
      profile.email ||
      null;
    return {
      name,
      subtitle,
      initials: initialsFrom(name, "T"),
      avatarUrl: profile.avatar_url ?? null,
    };
  }

  const name = profile?.full_name?.trim() || profile?.email || "Member";
  return {
    name,
    subtitle: profile?.email ?? null,
    initials: initialsFrom(name, "?"),
    avatarUrl: profile?.avatar_url ?? null,
  };
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * List every thread the currently signed-in non-admin user can see,
 * hydrated with counterparty info + messages + unread counts.
 */
export async function listThreadsForUser(userId: string): Promise<Thread[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("message_threads")
    .select("*")
    .or(
      `user_id.eq.${userId},company_user_id.eq.${userId},talent_user_id.eq.${userId}`
    )
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[messaging] listThreadsForUser failed:", error);
    return [];
  }

  return hydrateThreads({
    viewerUserId: userId,
    viewerIsAdmin: false,
    rows: (data as DbThreadRow[] | null) ?? [],
  });
}

/**
 * List every thread an admin should see: all admin_support threads across
 * the platform, plus any company↔candidate thread the admin happens to be
 * subscribed to (currently none by default — this is future-proofing).
 */
export async function listThreadsForAdmin(adminUserId: string): Promise<Thread[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("message_threads")
    .select("*")
    .eq("kind", "admin_support")
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[messaging] listThreadsForAdmin failed:", error);
    return [];
  }

  // For admin viewers, map the UI kind per-thread based on the supported
  // user's role (company → "company", talent → "candidate").
  const rows = (data as DbThreadRow[] | null) ?? [];
  const threads = await hydrateThreads({
    viewerUserId: adminUserId,
    viewerIsAdmin: true,
    rows,
  });

  if (threads.length === 0) return threads;

  // Second pass: refine kind for each thread based on supported user role.
  const ids = Array.from(
    new Set(
      rows.map((r) => r.user_id).filter((x): x is string => typeof x === "string")
    )
  );
  if (ids.length === 0) return threads;

  const { data: profileData } = await admin
    .from("profiles")
    .select("id, role")
    .in("id", ids);
  const roleByUser = new Map<string, "talent" | "company" | null>();
  for (const p of (profileData as { id: string; role: "talent" | "company" | null }[] | null) ?? []) {
    roleByUser.set(p.id, p.role);
  }

  const rowById = new Map<string, DbThreadRow>();
  for (const row of rows) rowById.set(row.id, row);

  return threads.map((t) => {
    const row = rowById.get(t.id);
    if (!row) return t;
    const role = row.user_id ? roleByUser.get(row.user_id) : null;
    const kind: ThreadKind = role === "company" ? "company" : "candidate";
    return { ...t, kind, pinned: false };
  });
}

/**
 * Total unread message count for a regular (non-admin) user — used for
 * nav badges. Keeps the query cheap by only scanning messages across the
 * user's threads.
 */
export async function unreadCountForUser(userId: string): Promise<number> {
  const admin = createAdminClient();

  const { data: threads } = await admin
    .from("message_threads")
    .select("id")
    .or(
      `user_id.eq.${userId},company_user_id.eq.${userId},talent_user_id.eq.${userId}`
    );

  const threadIds = (threads as { id: string }[] | null)?.map((t) => t.id) ?? [];
  if (threadIds.length === 0) return 0;

  const [{ data: reads }, { data: msgs }] = await Promise.all([
    admin
      .from("thread_reads")
      .select("thread_id, last_read_at")
      .eq("user_id", userId)
      .in("thread_id", threadIds),
    admin
      .from("messages")
      .select("thread_id, sender_user_id, system, created_at")
      .in("thread_id", threadIds)
      .eq("system", false),
  ]);

  const readBy = new Map<string, string>();
  for (const r of (reads as DbThreadReadRow[] | null) ?? []) {
    readBy.set(r.thread_id, r.last_read_at);
  }
  let total = 0;
  for (const m of (msgs as
    | { thread_id: string; sender_user_id: string | null; created_at: string }[]
    | null) ?? []) {
    if (m.sender_user_id === userId) continue;
    const lastRead = readBy.get(m.thread_id);
    if (!lastRead || new Date(m.created_at) > new Date(lastRead)) total++;
  }
  return total;
}

/** Total unread across every admin_support thread for this admin. */
export async function unreadCountForAdmin(adminUserId: string): Promise<number> {
  const admin = createAdminClient();

  const { data: threads } = await admin
    .from("message_threads")
    .select("id")
    .eq("kind", "admin_support");

  const threadIds = (threads as { id: string }[] | null)?.map((t) => t.id) ?? [];
  if (threadIds.length === 0) return 0;

  const [{ data: reads }, { data: msgs }] = await Promise.all([
    admin
      .from("thread_reads")
      .select("thread_id, last_read_at")
      .eq("user_id", adminUserId)
      .in("thread_id", threadIds),
    admin
      .from("messages")
      .select("thread_id, sender_is_admin, system, created_at")
      .in("thread_id", threadIds)
      .eq("system", false)
      .eq("sender_is_admin", false),
  ]);

  const readBy = new Map<string, string>();
  for (const r of (reads as DbThreadReadRow[] | null) ?? []) {
    readBy.set(r.thread_id, r.last_read_at);
  }
  let total = 0;
  for (const m of (msgs as
    | { thread_id: string; sender_is_admin: boolean; created_at: string }[]
    | null) ?? []) {
    const lastRead = readBy.get(m.thread_id);
    if (!lastRead || new Date(m.created_at) > new Date(lastRead)) total++;
  }
  return total;
}

/**
 * Thin helper used by sign-in redirects + the onboarding flow to decide
 * whether the viewer has any messaging history at all.
 */
export async function viewerHasThreads(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { count } = await supabase
    .from("message_threads")
    .select("id", { count: "exact", head: true });
  return (count ?? 0) > 0;
}
