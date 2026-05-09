# Veloraa Realtime Plan — Cascade's proposal

> Goal: turn the slow, "refresh-the-page" interactions across Veloraa into
> live, `onSnapshot`-style updates using **Supabase Realtime** — without
> rewriting the data layer or breaking existing code.
>
> Scope priorities (from the user):
> 1. Messaging — pings, unread badges, conversations.
> 2. Approve / decline of **applications** (talent + company).
> 3. Approve / decline of **profile updates** (`pending_update` flow).
> 4. Other obvious wins surfaced during the audit (invites, subscription
>    status, admin queue, recommendations).

---

## TL;DR

Supabase has the equivalent of Firestore's `onSnapshot`: the
`postgres_changes` channel on the realtime client. The codebase **already
uses it** in `@/components/messaging/MessagingPanelLive.tsx`, and the
schema already opts `messages` + `message_threads` into the
`supabase_realtime` publication. So the foundation is in place — the
problem is that **nothing else in the app uses it**, and even messaging
only goes halfway (in‑panel updates work, but the unread badge in the
shell only refreshes on navigation).

The plan below is a pragmatic, phased rollout that:

- **Reuses the existing pattern** (`<XLive>` client wrappers around
  server‑rendered content) so it feels native to the codebase.
- **Adds zero new dependencies.** Everything is `@supabase/supabase-js`
  features we already pay for.
- **Touches the schema only additively** — three small migrations that
  add tables to the realtime publication and confirm the SELECT RLS that
  already exists.
- **Leaves every server action and SSR fetch untouched.** Cold loads
  still produce the same HTML; realtime is a pure enhancement layer.
- Risk of breakage: **low**. The worst case if any of this goes wrong is
  "the badge doesn't tick live" — the underlying SSR fallback always
  catches up on next navigation.

---

## 1. Audit — what's there today

### 1.1 Stack

- **Next.js 16.2.4 / React 19.2.4** (App Router, Server Components,
  Server Actions). Per `AGENTS.md`, this is post‑training Next, so any
  Next‑specific code we ship later must check `node_modules/next/dist/docs/`
  before assuming an API.
- **Supabase**: `@supabase/ssr` 0.10.2, `@supabase/supabase-js` 2.104.0.
- Three Supabase clients in `@/lib/supabase/`:
  - `client.ts` — browser (anon key, JWT‑aware via cookies).
  - `server.ts` — RSC / server‑action (anon, cookie‑bound).
  - `admin.ts` — service‑role (bypasses RLS, server‑only).

### 1.2 What is already realtime ✅

| Surface | File | Behavior |
| --- | --- | --- |
| Messaging panel (in‑page) | `@/components/messaging/MessagingPanelLive.tsx` | Subscribes to `INSERT` on `public.messages` and `public.message_threads`. New messages append + dedupe optimistic twins. New threads trigger `router.refresh()`. |
| Messages publication | `supabase/schema.sql:601-607` | `alter publication supabase_realtime add table public.messages;` and same for `message_threads`. |
| Messaging RLS | `supabase/schema.sql:528-564` | `messages_select_participants` + `threads_select_participants` use `auth.uid()` and `public.is_admin()`. Realtime payloads respect these. |

### 1.3 What is **not** realtime ❌

| Surface | Where | Current behavior |
| --- | --- | --- |
| **Unread badge in shells** | `@/components/talent/TalentShell.tsx`, `@/components/company/CompanyShell.tsx`, `@/app/(admin)/admin/layout.tsx` | Server‑rendered from `unreadCountForUser` / `unreadCountForAdmin` (in `@/lib/messaging/queries.ts`). Sits stale until the user navigates. `MessagingPanelLive` only calls `router.refresh()` on **new threads**, not on every new message — so a new message in an existing thread updates the bubble inside the panel but the header/sidebar badge is stale. |
| **Talent profile status banner** | `@/app/(app)/talent/(shell)/profile/page.tsx` | Reads `talent_applications.review_status` server‑side. After admin approves/rejects, talent has to refresh to see "Update under review" → "Profile is live" / "Profile update rejected". |
| **Admin review queue** | `@/app/(admin)/admin/page.tsx` | Counts pending talent / company / jobs server‑side. New submissions don't appear until the admin reloads. Two admins reviewing simultaneously have no idea the other has acted. |
| **Talent invites** | `@/app/(app)/talent/(shell)/invites/page.tsx` | Static SSR list of `interview_invitations`. New invite from a company → user has to refresh. |
| **Company candidate / interview view** | `@/app/(app)/company/(shell)/candidates/page.tsx` | Same — talent accepting/declining doesn't push back. |
| **Subscription status** | `@/app/(app)/company/(shell)/subscription/page.tsx` | Reads `company_applications.subscription_status` etc. Paddle / PayFast webhook updates the row, but the user staring at the page sees nothing until reload. This is exactly the "billing event lands but UI is dead" gap the user mentioned. |
| **Notifications page** | `@/app/(app)/talent/(shell)/notifications/page.tsx` | **100% mocked.** Hardcoded `NOTIFICATIONS` array. Not wired to any DB table. |
| **Job recommendations** | `@/app/actions/admin-recommendations.ts` + talent dashboard | Server fetched. New recommendation = no live signal. |

### 1.4 Tables and the realtime publication

In `supabase_realtime` today: `messages`, `message_threads`. **Not yet
in the publication** but candidates for it:

- `talent_applications` — drives approve/decline + profile updates.
- `company_applications` — drives approve/decline + subscription state.
- `company_jobs` — drives admin job review queue.
- `interview_invitations` — drives talent invite + company shortlist.
- `job_recommendations` — drives talent dashboard "you've been picked"
  state.

(`thread_reads` could be added too, but we don't actually need it — the
unread count is derived locally on the client from the messages stream.)

### 1.5 RLS readiness

Good news: the SELECT policies needed for realtime payloads to be
delivered already exist for every candidate table:

- `talent_apps_select_own`, `company_apps_select_own`,
  `company_jobs_select_own`, `interview_invitations_select_participants`,
  `job_recommendations_select_company` /
  `job_recommendations_select_talent`.

The only missing piece for admins is they currently read these tables
through the **service‑role admin client** (which bypasses RLS) — that
means an admin tab won't receive realtime payloads on these tables
because realtime events are filtered by the *user's own JWT*, not the
service role. We solve this in §3.

---

## 2. Architecture — one shape, applied everywhere

### 2.1 The pattern (already proven by `MessagingPanelLive`)

```
[Server Component: SSR with first snapshot]
            │
            ▼
[Client Wrapper: <XLive initial={...} userId=...>]
            │     subscribes to `postgres_changes`
            ▼
[Existing presentational component]
```

Server still does the first paint. The wrapper opens **one** Supabase
channel, applies inserts/updates to local state, and hands the merged
state down to the dumb component. Same as `MessagingPanelLive`.

### 2.2 One channel per concern, multiplexed

Supabase Realtime sends every subscription through a single WebSocket.
We don't need a channel per row — we coalesce by *role*:

- **`user:{userId}`** — what the **current viewer** cares about.
  Subscribes filtered by `user_id=eq.{userId}` (or
  `talent_user_id` / `company_user_id`) so payloads stay tiny.
  - `messages` (already)
  - `message_threads` (already)
  - `talent_applications` UPDATE — approve/reject + profile‑update
    decisions.
  - `company_applications` UPDATE — approve/reject + subscription
    transitions (Paddle/PayFast webhook → row update → UI reacts).
  - `interview_invitations` INSERT/UPDATE — talent receives invites,
    company sees accept/decline.
  - `job_recommendations` INSERT — talent sees "a company picked you".

- **`admin:queue`** — only mounted under `/(admin)`. Subscribes
  unfiltered (RLS gates by `is_admin()`):
  - `talent_applications` INSERT/UPDATE — new submission appears, badge
    moves.
  - `company_applications` INSERT/UPDATE.
  - `company_jobs` INSERT/UPDATE — pending job review queue.

- **`thread:{threadId}`** — kept implicit inside `MessagingPanelLive`
  (already exists, fine).

### 2.3 React shape

A small `<RealtimeProvider>` (client) at each shell layout opens the
appropriate channel **once per tab** and exposes:

```ts
type RealtimeContext = {
  // live counters that the existing badge UI already accepts as props
  messagesUnread: number;
  invitesPending: number;
  appStatus: TalentAppStatus | CompanyAppStatus | null;
  // a generic "kick the server-fetched view" hook
  onChange: (table: string, cb: (row: unknown) => void) => () => void;
};
```

The **shell** layouts pass their SSR'd values as `initial*` props; the
provider seeds local state from them and updates it as events arrive.
Existing UI (`TalentShell`, `CompanyShell`, admin layout) reads from
context instead of from props. **No DOM restructuring required.**

For pages where the entire page is a list (invites, admin queue,
candidates, subscription), we wrap the page body in a thin
`<LiveX initial={...}>` client component that owns the list state. The
existing presentational components stay pure.

### 2.4 Optimistic + authoritative

Server actions (`approveTalent`, `rejectTalent`, `acceptInvitation`, …)
already call `revalidatePath(...)`. We **keep** those calls — they're
the safety net for users who navigate before the WebSocket event lands,
and for users on flaky connections who reload. Realtime is the fast
path; revalidate is the consistency floor. The wrapper components merge
both sources idempotently (the `MessagingPanelLive`
`reconcileServerThreads` pattern) so a double‑fire is a no‑op.

---

## 3. Database changes (small, additive, reversible)

A single new migration file, e.g. `supabase/realtime.sql`. Idempotent
just like `schema.sql`:

```sql
-- 1. Opt the rest of the user-visible tables into the realtime publication.
do $$ begin
  alter publication supabase_realtime add table public.talent_applications;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.company_applications;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.company_jobs;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.interview_invitations;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.job_recommendations;
exception when duplicate_object then null; end $$;

-- 2. Admin SELECT policies so admin tabs receive realtime payloads.
--    (Service-role bypass is fine for SSR but realtime is JWT-gated.)
drop policy if exists "talent_apps_admin_select" on public.talent_applications;
create policy "talent_apps_admin_select"
  on public.talent_applications for select
  to authenticated
  using ( public.is_admin(auth.uid()) );

drop policy if exists "company_apps_admin_select" on public.company_applications;
create policy "company_apps_admin_select"
  on public.company_applications for select
  to authenticated
  using ( public.is_admin(auth.uid()) );

drop policy if exists "company_jobs_admin_select" on public.company_jobs;
create policy "company_jobs_admin_select"
  on public.company_jobs for select
  to authenticated
  using ( public.is_admin(auth.uid()) );
```

That is the *entire* DB delta. No new tables (yet — see §6 Phase 3).

> **Why this is safe:** the existing per‑user policies
> (`*_select_own`) are unchanged; we only **add** an admin OR‑clause via
> a separate policy. Realtime payload delivery is the union of all
> applicable SELECT policies, so a normal user still only sees their
> own row, and an admin sees everything.

---

## 4. Phased rollout

### Phase 1 — Quick wins, highest user value (≈ 1 sitting)

#### 1a. Live unread badge in every shell

- Add `<MessagingBadgeProvider initialUnread={messagesUnread} userId={...}>`
  in:
  - `@/app/(app)/talent/(shell)/layout.tsx`
  - `@/app/(app)/company/(shell)/layout.tsx`
  - `@/app/(admin)/admin/layout.tsx`
- Subscribe to `messages` INSERT (filter by thread membership client
  side — same logic that's in `MessagingPanelLive`'s
  `setThreads(... unread + 1)`). Also subscribe to `thread_reads`
  UPDATE for the viewer to zero the count when another tab marks read.
- `TalentShell` / `CompanyShell` switch from a `messagesUnread` prop to
  reading the context value. Visual unchanged.
- **Files touched:** 3 layouts + 2 shells + 1 new provider. ~150 LOC,
  zero deletions.

#### 1b. Live admin review queue

- New `<LiveAdminQueue initial={rows} counts={counts}>` wrapping the
  body of `@/app/(admin)/admin/page.tsx`.
- Subscribes on `admin:queue` channel:
  - `talent_applications` INSERT → prepend row to "Pending" list, bump
    `counts.talent.pending`.
  - `talent_applications` UPDATE on `review_status` → move row between
    Pending / Approved / Rejected buckets.
  - Same for `company_applications` and `company_jobs`.
- Existing `<StatCard>`, `<TypeTab>` etc. stay untouched.
- Bonus: when *another* admin clicks Approve, the row turns into a
  ghost ("Approved by alex@…") for 4s before disappearing — purely a
  UI nicety on top of the same channel.

#### 1c. Live talent profile status

- New `<LiveProfileStatus initial={app}>` wrapping the body of
  `@/app/(app)/talent/(shell)/profile/page.tsx`.
- Subscribes to `talent_applications` UPDATE filtered by
  `user_id=eq.${user.id}`.
- When `review_status` changes:
  - `pending_update → approved` → swap banner to "Profile is live",
    flip the form back to read‑only state.
  - `pending_update → rejected` (or fail technical/interview) → swap
    to the rejection banner with `review_reason`. The `previous_*`
    fields are already in the realtime payload's `record.new` so the
    "Discard changes & make live" button stays wired.
  - `hidden → approved` (talent self‑served Make Live in another tab)
    → mirror the change.
- Same wrapper handles **technical** + **interview** stage transitions,
  since they're columns on the same row.

**End of Phase 1: the three things the user explicitly asked for are
live.**

### Phase 2 — Round out the obvious gaps

#### 2a. Live interview invitations (talent)

- `<LiveInvitesList initial={invitations}>` around the cards in
  `@/app/(app)/talent/(shell)/invites/page.tsx`.
- Subscribe `interview_invitations` filtered
  `talent_user_id=eq.${user.id}`. INSERT prepends; UPDATE mutates in
  place (status: pending → accepted / declined).
- The header stat tiles ("Pending 02", "Accepted 01") become live.

#### 2b. Live interview invitations (company)

- Mirror the above on the company side: filter
  `company_user_id=eq.${user.id}`. Company sees talent's accept/decline
  arrive without refresh.

#### 2c. Live subscription status (the user's billing example)

- `<LiveSubscriptionStatus initial={employer}>` around the status
  block in `@/app/(app)/company/(shell)/subscription/page.tsx`.
- Subscribe `company_applications` UPDATE filtered
  `user_id=eq.${user.id}`.
- When the Paddle / PayFast webhook (existing in
  `@/app/api/webhooks/paddle` etc., already updates the row) lands, the
  status pill flips `Free → Active`, the "Manage subscription" button
  appears, the period_end date renders. **Zero polling.**
- Also covers downgrade (`active → cancelled`) and `past_due` for the
  banner the page already has.

#### 2d. Live job recommendations

- Hook into talent dashboard. Subscribe `job_recommendations` filtered
  `talent_user_id=eq.${user.id}`. New row → toast + count badge on the
  Jobs nav item.

### Phase 3 — Real notifications (optional, biggest yield, biggest delta)

The notifications page is a fake. Two ways to make it real:

**Option A — Derived feed (no schema change).** A server util
`getNotificationFeed(userId)` that unions:

- recent `messages` (other party only),
- recent `interview_invitations` (status changes),
- recent `talent_applications` review/technical/interview decisions,
- recent `job_recommendations`.

Wrap with `<LiveNotificationsFeed>` that re‑runs the union on any of
the source channels and prepends locally. **No new table, no
migration.** Limitation: no read/unread tracking per *notification*
event (only per thread), and no cross‑device "mark all read".

**Option B — First‑class table** (recommended once we want push, mute,
mark‑read, email digests):

```sql
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null, -- 'message' | 'invite' | 'review_decision' | 'recommendation' | 'subscription'
  title       text not null,
  body        text,
  ref_table   text,          -- 'messages' | 'interview_invitations' | ...
  ref_id      uuid,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;
alter table public.notifications enable row level security;
create policy "notifications_select_own"  on public.notifications for select using ( user_id = auth.uid() );
create policy "notifications_update_own"  on public.notifications for update using ( user_id = auth.uid() ) with check ( user_id = auth.uid() );
alter publication supabase_realtime add table public.notifications;
```

Each existing server action that already does
`revalidatePath` (e.g. `approveTalent`, `acceptInvitation`,
`createRecommendation`) gains **one extra insert** into
`notifications`. The talent notifications page becomes a live‑backed
feed with proper read state and the shell badge can drive a global
"alerts" bubble.

We can ship Phase 3 later — Phases 1 and 2 do not depend on it.

---

## 5. File-by-file change list (preview, not yet built)

| File | Change | Risk |
| --- | --- | --- |
| `supabase/realtime.sql` | **NEW** migration (publication + admin RLS). | None — idempotent, additive. |
| `src/lib/realtime/channels.ts` | **NEW** — `subscribeUserChannel(userId, handlers)`, `subscribeAdminChannel(handlers)`. Thin wrapper around `createClient().channel(...)`. | None. Pure helper. |
| `src/components/realtime/RealtimeProvider.tsx` | **NEW** client provider used by shell layouts. | None — it only consumes context, defaults preserve current SSR values. |
| `src/components/realtime/LiveProfileStatus.tsx` | **NEW** client wrapper for talent profile page. | Low — wraps existing JSX. |
| `src/components/realtime/LiveAdminQueue.tsx` | **NEW** client wrapper for admin dashboard. | Low. |
| `src/components/realtime/LiveInvitesList.tsx` | **NEW** | Low. |
| `src/components/realtime/LiveSubscriptionStatus.tsx` | **NEW** | Low. |
| `src/app/(app)/talent/(shell)/layout.tsx` | Wrap children in `<RealtimeProvider userId initialMessagesUnread>`. | Low — pass-through. |
| `src/app/(app)/company/(shell)/layout.tsx` | Same. | Low. |
| `src/app/(admin)/admin/layout.tsx` | Same with `kind="admin"`. | Low. |
| `src/components/talent/TalentShell.tsx` | Read `messagesUnread` from context if present, else fall back to prop. | Low — pure addition. |
| `src/components/company/CompanyShell.tsx` | Same. | Low. |
| `src/app/(app)/talent/(shell)/profile/page.tsx` | Wrap status banners + form in `<LiveProfileStatus>`. | Low — JSX wrap only. |
| `src/app/(admin)/admin/page.tsx` | Wrap table body in `<LiveAdminQueue>`. | Low. |
| `src/app/(app)/talent/(shell)/invites/page.tsx` | Wrap list in `<LiveInvitesList>`. | Low. |
| `src/app/(app)/company/(shell)/subscription/page.tsx` | Wrap status block in `<LiveSubscriptionStatus>`. | Low. |
| `src/components/messaging/MessagingPanelLive.tsx` | Stop calling `router.refresh()` on every new message — local state already handles it. Keep `router.refresh()` only for new threads (current behavior). Optional: call into `RealtimeProvider` to update the global badge so we don't double-subscribe in the same tab. | Low — strictly an optimization. |

**Total new files: 7. Total touched files: 8 (all surgical).** No
deletions, no SQL drops, no breaking changes to server actions, schemas,
or shared types.

---

## 6. What we explicitly **do not** change

To keep blast radius small:

- **No change to server actions.** `approveTalent`, `rejectTalent`,
  `passTechnical`, `failTechnical`, `passInterview`, `failInterview`,
  `approveCompany`, `rejectCompany`, `resubmitProfileUpdate`,
  `makeProfileLive`, `revertProfileToPrevious`, `sendMessage`,
  `markThreadRead`, `acceptInvitation`, … — all keep their current
  shape, including their `revalidatePath` calls.
- **No change to `@/lib/messaging/queries.ts`.** The hydration logic
  for first paint is untouched.
- **No change to `@/lib/billing/*`.** Webhooks already write the
  `subscription_*` columns; we just listen.
- **No change to existing RLS policies.** New admin SELECT policies are
  pure additions.
- **No new dependencies, no new build steps.**

---

## 7. Risks, edge cases, mitigations

| Risk | Mitigation |
| --- | --- |
| Stale channel after token refresh (browser sleeps for 30 min, Supabase JWT rotates). | `@supabase/ssr` already handles JWT rotation on the browser client. The Realtime client re‑auths on `TOKEN_REFRESHED`. We add a `visibilitychange` listener: when the tab returns from hidden, force one `router.refresh()` so SSR re‑hydrates the truth. |
| Double‑fire (server action's `revalidatePath` + realtime event arrive close together). | Wrappers do idempotent merges keyed by row `id` + `updated_at` (same trick as `MessagingPanelLive.reconcileServerThreads`). |
| Admin tabs flooded if 100 applications submit at once. | We filter by `event` and `table`, debounce UI updates with `requestAnimationFrame`, and only re‑sort on each animation frame, not per event. |
| RLS payload leak. | Realtime applies the same SELECT policies as a regular query. We test by signing in as a talent and confirming we receive zero events for *another* user's `talent_applications` UPDATE. (The existing `talent_apps_select_own` policy makes this true by construction.) |
| Mobile / battery. | One WebSocket per tab, idle when nothing is happening. Same cost as the messaging page already incurs today. |
| Webhook → DB write → Realtime delay. | Supabase Realtime ships logical decoding events within ~50–500 ms. Fine for billing UX. If a webhook is in flight when the user lands on the page, SSR shows the stale value and Realtime corrects it within half a second. |
| Two tabs open (same user). | Each tab has its own channel; both update independently. `markThreadRead` from tab A pushes a `thread_reads` UPDATE that tab B sees → its badge zeros too. |
| Service-role inserts (admin actions, webhook handlers). | Service-role writes still emit realtime events — they're DB‑level. RLS still gates *delivery*, which is what we want. |

---

## 8. Acceptance criteria (how we'll know it works)

Phase 1 done when:

- [ ] Talent A in tab 1 sends a message to Talent B → Talent B's
      shell badge ticks within 1 s **without navigation**.
- [ ] Admin clicks Approve on a talent application → that talent's
      `/talent/profile` page (open in another browser) flips to "Profile
      is live" within 1 s.
- [ ] Admin clicks Reject on a profile update → talent's page swaps to
      the rejection banner with reason within 1 s.
- [ ] A second admin in a different tab sees the row leave the Pending
      bucket of `/admin` within 1 s.

Phase 2 done when:

- [ ] Company sends an interview invite → talent's `/talent/invites`
      list grows by one card live.
- [ ] Talent accepts → company sees the card transition to "Accepted"
      live and the new thread shows up in messaging.
- [ ] Paddle webhook flips `subscription_status` → company's
      `/company/subscription` page reflects "Active" + new period dates
      within 1 s.

Phase 3 done when:

- [ ] Talent notifications page renders real events.
- [ ] Mark‑all‑read works cross‑tab.

---

## 9. Effort estimate

- **Phase 1**: ~1 focused session (3–5 hours). One SQL migration, one
  context provider, three wrapper components, three layout edits.
- **Phase 2**: ~2–3 hours additive on top of Phase 1.
- **Phase 3**: ~3–4 hours (table + realtime + notifications page rewrite
  + 5–8 server actions each get a single `notifications.insert`).

Total: well under a day's work for the realtime story end‑to‑end, with
each phase shippable independently.

---

## 10. Open questions for the user

1. **Notifications page**: prefer **Phase 3 Option A** (derived, no
   table) or **Option B** (real `notifications` table with read state)?
   Option B is more work but unlocks email digests, push, and proper
   muting later.
2. **Admin co‑editing UX**: when admin A approves a talent that admin B
   is currently viewing, do we want a soft toast ("Approved by alex@
   2s ago") or just a silent state flip?
3. **Sound / desktop notification ping** when a message arrives in the
   background — yes for talent + company, no for admin? Or off by
   default with a settings toggle?
4. **Subscription transitions**: do we want a live confetti / banner on
   `free → active`, or just the silent pill swap?

These don't block any of the implementation — they just steer the
copy/UX layer.

---

*Authored by Cascade — ready to compare against Claude Code, Codex, and
Gemini.*
