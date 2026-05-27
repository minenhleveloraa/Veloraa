"use client";

import {
  FormEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarClock,
  CheckCheck,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Phone,
  Pin,
  Search,
  Send,
  Shield,
  Smile,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message, Thread, ThreadKind } from "./types";

// ---------------------------------------------------------------------------
// Public props
// ---------------------------------------------------------------------------

/** Lightweight job descriptor used in the interview scheduler. */
export interface CompanyJobOption {
  id: string;
  title: string;
}

export interface MessagingPanelProps {
  threads: Thread[];
  /** Label shown above thread list (e.g. "Messages"). */
  title?: string;
  /** Short description shown under the title. */
  description?: string;
  /** Viewer info used for own-bubble initials / header alignment. */
  viewer: { name: string; initials: string };
  /** Thread kinds that should surface the "schedule interview" control. */
  scheduleKinds?: ThreadKind[];
  /** Thread kinds that should show call/video header actions. */
  callKinds?: ThreadKind[];
  /** Empty-state copy when no thread is selected on desktop. */
  emptyThreadCopy?: { title: string; body: string };
  /** Optional preselected thread id (useful on desktop). */
  initialThreadId?: string;
  /** When provided, hides the "search threads" input. */
  hideSearch?: boolean;
  /**
   * Send a message. Resolves once the server has accepted the write. Reject
   * to surface an error; callers are responsible for unwinding optimistic
   * state in that case.
   */
  onSendMessage?: (threadId: string, body: string) => Promise<void> | void;
  /** Fires when a thread is opened — used by parent to mark-as-read. */
  onOpenThread?: (threadId: string) => void;

  // ── Interview scheduling (company side) ──────────────────────────
  /** Published jobs the company can schedule interviews for. */
  companyJobs?: CompanyJobOption[];
  /** Fire when the company submits an interview invitation from within the chat. */
  onScheduleInterview?: (
    threadId: string,
    talentUserId: string,
    data: { jobId: string; dates: string[]; message?: string }
  ) => Promise<{ ok: boolean; message?: string }>;

  // ── Interview response (talent side) ─────────────────────────────
  /** "company" | "talent" — controls which interview card actions appear. */
  viewerRole?: "company" | "talent";
  /** Accept an interview invitation (talent picks one proposed date). */
  onAcceptInterview?: (
    invitationId: string,
    selectedDate: string
  ) => Promise<{ ok: boolean; message?: string }>;
  /** Decline an interview invitation with an optional reason. */
  onDeclineInterview?: (
    invitationId: string,
    reason?: string
  ) => Promise<{ ok: boolean; message?: string }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  const diffDays = Math.floor(diffH / 24);
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function dayGroup(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  const isSame = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (isSame(date, now)) return "Today";
  if (isSame(date, y)) return "Yesterday";
  const diff = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 7) {
    return date.toLocaleDateString([], { weekday: "long" });
  }
  return date.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function kindLabel(kind: ThreadKind): string {
  switch (kind) {
    case "admin":
      return "Veloraa Team";
    case "candidate":
      return "Candidate";
    case "company":
      return "Company";
    case "team":
      return "Team";
  }
}

function kindAccent(kind: ThreadKind): {
  bg: string;
  text: string;
  ring: string;
} {
  if (kind === "admin") {
    return {
      bg: "bg-gradient-to-br from-accent/25 via-accent/10 to-accent/5",
      text: "text-accent",
      ring: "ring-accent/30",
    };
  }
  return {
    bg: "bg-pill-bg",
    text: "text-accent",
    ring: "ring-edge",
  };
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export default function MessagingPanel({
  threads,
  title = "Messages",
  description,
  viewer,
  scheduleKinds = [],
  callKinds = [],
  emptyThreadCopy = {
    title: "Pick a conversation",
    body: "Select a thread on the left to start chatting.",
  },
  initialThreadId,
  hideSearch = false,
  onSendMessage,
  onOpenThread,
  companyJobs,
  onScheduleInterview,
  viewerRole,
  onAcceptInterview,
  onDeclineInterview,
}: MessagingPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    initialThreadId ?? null
  );
  const [query, setQuery] = useState("");
  // Locally track threads the viewer has opened this session so unread
  // badges clear instantly — the authoritative reset still happens server-
  // side via onOpenThread.
  const [openedIds, setOpenedIds] = useState<Set<string>>(() =>
    initialThreadId ? new Set([initialThreadId]) : new Set()
  );

  // Display-ready threads: sorted + unread-suppressed for opened threads.
  const displayThreads = useMemo(() => {
    const cloned = threads.map((t) =>
      openedIds.has(t.id) ? { ...t, unread: 0 } : t
    );
    return cloned.sort(sortThreads);
  }, [threads, openedIds]);

  // Fire the read-receipt side-effect for the initially-opened thread
  // exactly once on mount. No setState here — pure side effect.
  const didInitialOpenRef = useRef(false);
  useEffect(() => {
    if (didInitialOpenRef.current) return;
    if (!selectedId) return;
    didInitialOpenRef.current = true;
    onOpenThread?.(selectedId);
  }, [selectedId, onOpenThread]);

  const selected = useMemo(
    () => displayThreads.find((t) => t.id === selectedId) ?? null,
    [displayThreads, selectedId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return displayThreads;
    return displayThreads.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.subtitle ?? "").toLowerCase().includes(q) ||
        (t.lastMessage ?? "").toLowerCase().includes(q)
    );
  }, [query, displayThreads]);

  function handleSelect(id: string) {
    setSelectedId(id);
    setOpenedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    onOpenThread?.(id);
  }

  function handleSend(body: string) {
    if (!selected || selected.disabled) return;
    const trimmed = body.trim();
    if (!trimmed) return;
    onSendMessage?.(selected.id, trimmed);
  }

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-page">
      {/* Thread list */}
      <aside
        className={cn(
          "flex h-full w-full flex-col border-edge bg-page-alt/40 lg:w-[340px] lg:border-r xl:w-[380px]",
          selected ? "hidden lg:flex" : "flex"
        )}
      >
        <ListHeader
          title={title}
          description={description}
          count={displayThreads.reduce((acc, t) => acc + (t.unread ?? 0), 0)}
        />
        {!hideSearch && (
          <div className="px-4 pb-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search conversations…"
                className="w-full rounded-full border border-edge bg-surface py-2 pl-9 pr-3 text-sm text-heading placeholder:text-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 font-raleway"
              />
            </label>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pb-4">
          {filtered.length === 0 ? (
            <EmptyThreadList hasQuery={!!query.trim()} />
          ) : (
            <ul className="flex flex-col gap-1 px-2">
              {filtered.map((t) => (
                <ThreadRow
                  key={t.id}
                  thread={t}
                  active={t.id === selectedId}
                  onClick={() => handleSelect(t.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Thread view */}
      <section
        className={cn(
          "flex h-full flex-1 flex-col bg-page",
          selected ? "flex" : "hidden lg:flex"
        )}
      >
        {selected ? (
          <ThreadView
            key={selected.id}
            thread={selected}
            viewer={viewer}
            onBack={() => setSelectedId(null)}
            onSend={handleSend}
            showSchedule={scheduleKinds.includes(selected.kind)}
            showCall={callKinds.includes(selected.kind)}
            companyJobs={companyJobs}
            onScheduleInterview={onScheduleInterview}
            viewerRole={viewerRole}
            onAcceptInterview={onAcceptInterview}
            onDeclineInterview={onDeclineInterview}
          />
        ) : (
          <EmptyThreadPane copy={emptyThreadCopy} />
        )}
      </section>
    </div>
  );
}

function sortThreads(a: Thread, b: Thread): number {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
  const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
  return bt - at;
}

// ---------------------------------------------------------------------------
// List header + rows
// ---------------------------------------------------------------------------

function ListHeader({
  title,
  description,
  count,
}: {
  title: string;
  description?: string;
  count: number;
}) {
  return (
    <div className="px-5 pb-3 pt-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-heading font-raleway">
          {title}
        </h2>
        {count > 0 && (
          <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white font-jetbrains">
            {count} new
          </span>
        )}
      </div>
      {description && (
        <p className="mt-1 text-xs text-body font-raleway">{description}</p>
      )}
    </div>
  );
}

function ThreadRow({
  thread,
  active,
  onClick,
}: {
  thread: Thread;
  active: boolean;
  onClick: () => void;
}) {
  const accent = kindAccent(thread.kind);
  const last = thread.lastMessage ?? "Start the conversation →";

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all",
          "hover:bg-surface",
          active && "bg-surface shadow-[inset_0_0_0_1px] shadow-accent/30"
        )}
      >
        {active && (
          <motion.span
            layoutId="thread-active-indicator"
            className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-accent"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
        <Avatar thread={thread} size="md" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                "flex items-center gap-1 truncate text-sm font-semibold font-raleway",
                active ? "text-heading" : "text-heading"
              )}
            >
              <span className="truncate">{thread.name}</span>
              {thread.kind === "admin" && (
                <Shield
                  className="h-3 w-3 shrink-0 text-accent"
                  aria-label="Official Veloraa admin"
                />
              )}
              {thread.pinned && (
                <Pin className="h-3 w-3 shrink-0 text-subtle" />
              )}
            </p>
            <span
              className={cn(
                "shrink-0 text-[10px] font-medium font-jetbrains",
                (thread.unread ?? 0) > 0 ? "text-accent" : "text-subtle"
              )}
            >
              {formatRelativeTime(thread.lastMessageAt)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                "truncate text-xs font-raleway",
                (thread.unread ?? 0) > 0
                  ? "font-semibold text-body"
                  : "text-subtle"
              )}
            >
              {last}
            </p>
            {(thread.unread ?? 0) > 0 ? (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white font-jetbrains">
                {thread.unread! > 9 ? "9+" : thread.unread}
              </span>
            ) : (
              <span className={cn("h-4 w-4 shrink-0", accent.text)} />
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

function EmptyThreadList({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pill-bg text-accent">
        <MessageSquare className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-heading font-raleway">
          {hasQuery ? "No matches" : "No conversations yet"}
        </p>
        <p className="mt-1 text-xs text-body font-raleway">
          {hasQuery
            ? "Try a different search term."
            : "New threads will appear here."}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thread view
// ---------------------------------------------------------------------------

function ThreadView({
  thread,
  viewer,
  onBack,
  onSend,
  showSchedule,
  showCall,
  companyJobs,
  onScheduleInterview,
  viewerRole,
  onAcceptInterview,
  onDeclineInterview,
}: {
  thread: Thread;
  viewer: { name: string; initials: string };
  onBack: () => void;
  onSend: (body: string) => void;
  showSchedule: boolean;
  showCall: boolean;
  companyJobs?: CompanyJobOption[];
  onScheduleInterview?: MessagingPanelProps["onScheduleInterview"];
  viewerRole?: "company" | "talent";
  onAcceptInterview?: MessagingPanelProps["onAcceptInterview"];
  onDeclineInterview?: MessagingPanelProps["onDeclineInterview"];
}) {
  return (
    <>
      <ThreadHeader
        thread={thread}
        onBack={onBack}
        showSchedule={showSchedule}
        showCall={showCall}
      />
      <MessageList
        thread={thread}
        viewerInitials={viewer.initials}
        viewerRole={viewerRole}
        onAcceptInterview={onAcceptInterview}
        onDeclineInterview={onDeclineInterview}
      />
      <Composer
        thread={thread}
        onSend={onSend}
        showSchedule={showSchedule}
        companyJobs={companyJobs}
        onScheduleInterview={onScheduleInterview}
      />
    </>
  );
}

function ThreadHeader({
  thread,
  onBack,
  showSchedule,
  showCall,
}: {
  thread: Thread;
  onBack: () => void;
  showSchedule: boolean;
  showCall: boolean;
}) {
  return (
    <header className="flex items-center gap-3 border-b border-edge bg-page/80 px-3 py-3 backdrop-blur-xl sm:px-5">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to conversations"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-edge bg-surface text-body transition-colors hover:border-accent/40 hover:text-accent lg:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <Avatar thread={thread} size="md" />

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-heading font-raleway">
          <span className="truncate">{thread.name}</span>
          {thread.kind === "admin" && (
            <Shield className="h-3.5 w-3.5 shrink-0 text-accent" />
          )}
        </p>
        <p className="truncate text-[11px] text-subtle font-jetbrains">
          {thread.online ? (
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Online
            </span>
          ) : (
            thread.subtitle || kindLabel(thread.kind)
          )}
        </p>
      </div>

      <div className="flex items-center gap-1">
        {showSchedule && (
          <HeaderIconButton
            icon={CalendarClock}
            label="Schedule interview"
            highlight
          />
        )}
        {showCall && (
          <>
            <HeaderIconButton icon={Phone} label="Voice call" />
            <HeaderIconButton icon={Video} label="Video call" />
          </>
        )}
        <HeaderIconButton icon={MoreVertical} label="Conversation menu" />
      </div>
    </header>
  );
}

function HeaderIconButton({
  icon: Icon,
  label,
  highlight = false,
}: {
  icon: LucideIcon;
  label: string;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "group relative flex h-9 w-9 items-center justify-center rounded-full border transition-all",
        highlight
          ? "border-accent/30 bg-accent/5 text-accent hover:bg-accent/10 hover:shadow-[0_0_18px_-4px_rgba(74,222,128,0.5)]"
          : "border-transparent text-body hover:border-edge hover:bg-surface"
      )}
    >
      <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Message list + day separators
// ---------------------------------------------------------------------------

function MessageList({
  thread,
  viewerInitials,
  viewerRole,
  onAcceptInterview,
  onDeclineInterview,
}: {
  thread: Thread;
  viewerInitials: string;
  viewerRole?: "company" | "talent";
  onAcceptInterview?: MessagingPanelProps["onAcceptInterview"];
  onDeclineInterview?: MessagingPanelProps["onDeclineInterview"];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever the thread id changes or messages length grows.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [thread.id, thread.messages.length]);

  // Group messages by day
  const groups = useMemo(() => {
    const out: Array<{ day: string; messages: Message[] }> = [];
    for (const m of thread.messages) {
      const key = dayGroup(m.at);
      const last = out[out.length - 1];
      if (!last || last.day !== key) out.push({ day: key, messages: [m] });
      else last.messages.push(m);
    }
    return out;
  }, [thread.messages]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto bg-gradient-to-b from-page via-page to-page-alt/40"
    >
      <div className="mx-auto w-full max-w-3xl px-3 py-6 sm:px-6">
        {thread.messages.length === 0 ? (
          <ThreadIntroCard thread={thread} />
        ) : (
          <div className="flex flex-col gap-6">
            {groups.map((g) => (
              <div key={g.day} className="flex flex-col gap-1">
                <DaySeparator label={g.day} />
                <div className="flex flex-col gap-1">
                  {g.messages.map((m, idx) => (
                    <MessageBubble
                      key={m.id}
                      message={m}
                      previous={g.messages[idx - 1]}
                      next={g.messages[idx + 1]}
                      threadKind={thread.kind}
                      viewerInitials={viewerInitials}
                      viewerRole={viewerRole}
                      onAcceptInterview={onAcceptInterview}
                      onDeclineInterview={onDeclineInterview}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DaySeparator({ label }: { label: string }) {
  return (
    <div className="my-3 flex items-center justify-center">
      <span className="rounded-full border border-edge bg-surface px-3 py-0.5 text-[10px] uppercase tracking-[0.1em] text-subtle font-jetbrains">
        {label}
      </span>
    </div>
  );
}

function ThreadIntroCard({ thread }: { thread: Thread }) {
  const isAdmin = thread.kind === "admin";
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-edge bg-surface p-6 text-center">
      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl ring-1",
          kindAccent(thread.kind).bg,
          kindAccent(thread.kind).ring
        )}
      >
        {isAdmin ? (
          <Shield className="h-6 w-6 text-accent" />
        ) : (
          <Sparkles className="h-6 w-6 text-accent" />
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-heading font-raleway">
          {isAdmin
            ? `You're connected to the ${thread.name}`
            : `Start chatting with ${thread.name}`}
        </p>
        <p className="mt-1 text-xs text-body font-raleway">
          {isAdmin
            ? "Questions, approvals, feedback — we reply within business hours."
            : thread.subtitle ?? "Send your first message to get things going."}
        </p>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  previous,
  next,
  threadKind,
  viewerInitials,
  viewerRole,
  onAcceptInterview,
  onDeclineInterview,
}: {
  message: Message;
  previous?: Message;
  next?: Message;
  threadKind: ThreadKind;
  viewerInitials: string;
  viewerRole?: "company" | "talent";
  onAcceptInterview?: MessagingPanelProps["onAcceptInterview"];
  onDeclineInterview?: MessagingPanelProps["onDeclineInterview"];
}) {
  if (message.system) {
    // Check if this is a structured interview card
    const card = parseInterviewCard(message.body);
    if (card) {
      return (
        <InterviewCardBubble
          card={card}
          at={message.at}
          viewerRole={viewerRole}
          onAcceptInterview={onAcceptInterview}
          onDeclineInterview={onDeclineInterview}
        />
      );
    }
    return (
      <div className="my-2 flex justify-center">
        <span className="rounded-full bg-page-alt px-3 py-1 text-[11px] text-subtle font-jetbrains">
          {message.body}
        </span>
      </div>
    );
  }

  const self = message.fromSelf;
  const groupedWithPrev =
    previous && previous.fromSelf === self && !previous.system;
  const groupedWithNext = next && next.fromSelf === self && !next.system;
  const showTail = !groupedWithNext;

  const side = self ? "justify-end" : "justify-start";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn("flex items-end gap-2", side)}
    >
      {!self && (
        <div
          className={cn(
            "shrink-0",
            groupedWithNext ? "invisible" : "visible"
          )}
          aria-hidden
        >
          <MiniAvatar kind={threadKind} />
        </div>
      )}

      <div
        className={cn(
          "relative max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed sm:max-w-[70%] font-raleway",
          self
            ? "bg-accent text-white"
            : "border border-edge bg-surface text-heading",
          // Rounded corner "tail" — flattens the inner corner on the bottom of
          // each message group to create the chat-bubble look.
          self
            ? showTail
              ? "rounded-br-md"
              : "rounded-br-2xl"
            : showTail
            ? "rounded-bl-md"
            : "rounded-bl-2xl",
          groupedWithPrev ? "mt-0.5" : "mt-2"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <div
          className={cn(
            "mt-1 flex items-center gap-1 text-[10px] font-jetbrains",
            self ? "justify-end text-white/70" : "justify-end text-subtle"
          )}
        >
          {formatMessageTime(message.at)}
          {self && (
            <CheckCheck
              className={cn(
                "h-3 w-3",
                message.read ? "text-white" : "text-white/50"
              )}
            />
          )}
        </div>
      </div>

      {self && (
        <div
          className={cn(
            "shrink-0",
            groupedWithNext ? "invisible" : "visible"
          )}
          aria-hidden
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent font-raleway">
            {viewerInitials}
          </span>
        </div>
      )}
    </motion.div>
  );
}

function MiniAvatar({ kind }: { kind: ThreadKind }) {
  const a = kindAccent(kind);
  const Icon = kind === "admin" ? Shield : Sparkles;
  return (
    <span
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full ring-1",
        a.bg,
        a.ring
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", a.text)} />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Composer
// ---------------------------------------------------------------------------

function Composer({
  thread,
  onSend,
  showSchedule,
  companyJobs,
  onScheduleInterview,
}: {
  thread: Thread;
  onSend: (body: string) => void;
  showSchedule: boolean;
  companyJobs?: CompanyJobOption[];
  onScheduleInterview?: MessagingPanelProps["onScheduleInterview"];
}) {
  // ThreadView uses `key={thread.id}` so this Composer is remounted
  // whenever the active conversation changes. That means `draft` naturally
  // starts empty per thread — no manual reset effect required.
  const [draft, setDraft] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function autoresize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (thread.disabled) return;
    const body = draft.trim();
    if (!body) return;
    onSend(body);
    setDraft("");
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.focus();
    }
  }

  if (thread.disabled) {
    return (
      <div className="border-t border-edge bg-surface px-4 py-4 text-center text-xs text-subtle font-jetbrains">
        {thread.disabledReason ?? "Messaging is disabled for this thread."}
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {scheduling && (
          <ScheduleStrip
            thread={thread}
            companyJobs={companyJobs}
            onScheduleInterview={onScheduleInterview}
            onClose={() => setScheduling(false)}
          />
        )}
      </AnimatePresence>
      <form
        onSubmit={submit}
        className="border-t border-edge bg-page/80 px-3 py-3 backdrop-blur-xl sm:px-5"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-end gap-2">
          <ComposerIconButton
            icon={Paperclip}
            label="Attach file"
            variant="ghost"
          />
          {showSchedule && (
            <ComposerIconButton
              icon={CalendarClock}
              label="Schedule interview"
              variant="accent"
              active={scheduling}
              onClick={() => setScheduling((s) => !s)}
            />
          )}

          <label className="flex-1">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                autoresize();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={1}
              placeholder={
                thread.kind === "admin"
                  ? "Message the Veloraa team…"
                  : thread.kind === "candidate"
                  ? "Write to the candidate…"
                  : "Type a message…"
              }
              className="block max-h-40 w-full resize-none rounded-2xl border border-edge bg-surface px-4 py-2.5 text-sm text-heading placeholder:text-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 font-raleway"
            />
          </label>

          <ComposerIconButton
            icon={Smile}
            label="Emoji"
            variant="ghost"
          />
          <button
            type="submit"
            disabled={draft.trim().length === 0}
            aria-label="Send message"
            className={cn(
              "group flex h-11 w-11 items-center justify-center rounded-full transition-all",
              draft.trim().length === 0
                ? "bg-pill-bg text-subtle"
                : "bg-accent text-white shadow-[0_10px_24px_-12px_rgba(74,222,128,0.8)] hover:opacity-95"
            )}
          >
            <Send
              className={cn(
                "h-4 w-4 transition-transform",
                draft.trim().length > 0 &&
                  "group-hover:translate-x-[2px] group-hover:-translate-y-[2px]"
              )}
            />
          </button>
        </div>
        <p className="mt-2 hidden text-[10px] text-subtle font-jetbrains sm:block">
          Press <kbd className="rounded bg-surface px-1">Enter</kbd> to send ·{" "}
          <kbd className="rounded bg-surface px-1">Shift + Enter</kbd> for a
          new line
        </p>
      </form>
    </>
  );
}

function ComposerIconButton({
  icon: Icon,
  label,
  variant = "ghost",
  active = false,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  variant?: "ghost" | "accent";
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active || undefined}
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all",
        variant === "accent"
          ? active
            ? "border-accent bg-accent text-white shadow-[0_0_18px_-4px_rgba(74,222,128,0.6)]"
            : "border-accent/30 bg-accent/5 text-accent hover:bg-accent/10"
          : "border-transparent text-body hover:border-edge hover:bg-surface"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function generateSmartSlots(): { label: string; iso: string }[] {
  const now = new Date();
  const slots: { label: string; iso: string }[] = [];
  const hours = [10, 14, 16]; // 10 AM, 2 PM, 4 PM

  const dayLabel = (d: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(d);
    target.setHours(0, 0, 0, 0);
    const diff = Math.round(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  };

  const hourLabel = (h: number): string => {
    const ampm = h >= 12 ? "pm" : "am";
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${h12}${ampm}`;
  };

  for (let dayOffset = 0; dayOffset <= 10 && slots.length < 6; dayOffset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    if (d.getDay() === 0 || d.getDay() === 6) continue; // skip weekends

    for (const h of hours) {
      const slot = new Date(d);
      slot.setHours(h, 0, 0, 0);
      if (slot.getTime() - now.getTime() < 60 * 60 * 1000) continue; // at least 1h from now
      slots.push({ label: `${dayLabel(slot)} ${hourLabel(h)}`, iso: slot.toISOString() });
      if (slots.length >= 6) break;
    }
  }
  return slots;
}

function ScheduleStrip({
  thread,
  companyJobs,
  onScheduleInterview,
  onClose,
}: {
  thread: Thread;
  companyJobs?: CompanyJobOption[];
  onScheduleInterview?: MessagingPanelProps["onScheduleInterview"];
  onClose: () => void;
}) {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(
    companyJobs?.[0]?.id ?? ""
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const smartSlots = useMemo(() => generateSmartSlots(), []);

  function toggleSlot(iso: string) {
    setSelectedDates((prev) => {
      if (prev.includes(iso)) return prev.filter((d) => d !== iso);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, iso];
    });
    setError(null);
  }

  async function handleSend() {
    if (!onScheduleInterview || !thread.talentUserId || !selectedJobId) return;
    if (selectedDates.length === 0) {
      setError("Select at least one time slot.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await onScheduleInterview(thread.id, thread.talentUserId, {
        jobId: selectedJobId,
        dates: selectedDates,
      });
      if (res?.ok) {
        setSuccess(true);
        setTimeout(onClose, 1200);
      } else {
        setError(res?.message ?? "Failed to send invitation.");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  const jobs = companyJobs ?? [];

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="overflow-hidden border-t border-accent/20 bg-gradient-to-r from-accent/10 via-accent/5 to-transparent"
    >
      <div className="flex items-start gap-3 px-4 py-3 sm:px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <CalendarClock className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-heading font-raleway">
            Schedule an interview
          </p>

          {success ? (
            <p className="mt-1 text-xs font-semibold text-accent font-raleway">
              Invitation sent!
            </p>
          ) : (
            <>
              {jobs.length === 0 ? (
                <p className="mt-0.5 text-xs text-body font-raleway">
                  No published jobs to schedule interviews for.
                </p>
              ) : (
                <>
                  {jobs.length > 1 && (
                    <select
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-edge bg-surface px-2.5 py-1.5 text-xs text-heading font-raleway focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                    >
                      {jobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.title}
                        </option>
                      ))}
                    </select>
                  )}
                  {jobs.length === 1 && (
                    <p className="mt-0.5 text-[11px] text-body font-jetbrains truncate">
                      For: {jobs[0].title}
                    </p>
                  )}

                  <p className="mt-2 text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
                    Pick up to 3 time slots
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {smartSlots.map((slot) => {
                      const isSelected = selectedDates.includes(slot.iso);
                      return (
                        <button
                          key={slot.iso}
                          type="button"
                          onClick={() => toggleSlot(slot.iso)}
                          disabled={
                            !isSelected && selectedDates.length >= 3
                          }
                          className={cn(
                            "rounded-full border px-3 py-1 text-[11px] font-semibold transition-all font-raleway",
                            isSelected
                              ? "border-accent bg-accent text-white shadow-sm"
                              : "border-accent/30 bg-surface text-accent hover:bg-accent/10",
                            !isSelected &&
                              selectedDates.length >= 3 &&
                              "opacity-40 cursor-not-allowed"
                          )}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>

                  {error && (
                    <p className="mt-1.5 text-[11px] text-red-500 font-raleway">
                      {error}
                    </p>
                  )}

                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={
                        sending ||
                        selectedDates.length === 0 ||
                        !selectedJobId
                      }
                      className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-raleway"
                    >
                      {sending ? (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                      Send invitation
                    </button>
                    <span className="text-[10px] text-subtle font-jetbrains">
                      {selectedDates.length}/3 selected
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close scheduling"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-body transition-colors hover:bg-surface"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Avatars + empty state
// ---------------------------------------------------------------------------

function Avatar({
  thread,
  size = "md",
}: {
  thread: Thread;
  size?: "sm" | "md" | "lg";
}) {
  const dims =
    size === "lg"
      ? "h-12 w-12 text-base"
      : size === "sm"
      ? "h-8 w-8 text-[11px]"
      : "h-10 w-10 text-sm";
  const a = kindAccent(thread.kind);
  const initials =
    thread.avatarInitials ||
    thread.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") ||
    "?";

  return (
    <span className="relative inline-flex shrink-0">
      <span
        className={cn(
          "flex items-center justify-center rounded-full font-bold ring-1 font-raleway",
          a.bg,
          a.text,
          a.ring,
          dims
        )}
      >
        {thread.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thread.avatarUrl} alt="Avatar" className="h-full w-full rounded-full object-cover" />
        ) : thread.kind === "admin" ? (
          <Shield className="h-1/2 w-1/2" />
        ) : (
          initials
        )}
      </span>
      {thread.online && (
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-page-alt bg-accent" />
      )}
    </span>
  );
}

function EmptyThreadPane({
  copy,
}: {
  copy: { title: string; body: string };
}) {
  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-br from-page via-page to-page-alt/40">
      <div className="mx-6 flex max-w-md flex-col items-center gap-4 text-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-accent/10 text-accent">
          <MessageSquare className="h-9 w-9" />
          <span className="absolute -right-1 -top-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
          </span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-heading font-raleway">
            {copy.title}
          </h3>
          <p className="mt-1 text-sm text-body font-raleway">{copy.body}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Interview card helpers
// ---------------------------------------------------------------------------

interface InterviewCard {
  type: "interview_invite" | "interview_accepted" | "interview_declined";
  invitation_id?: string;
  job_id?: string;
  job_title: string;
  proposed_dates?: string[];
  accepted_date?: string;
  message?: string | null;
  reason?: string | null;
}

function parseInterviewCard(body: string): InterviewCard | null {
  try {
    const parsed = JSON.parse(body);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.type === "string" &&
      ["interview_invite", "interview_accepted", "interview_declined"].includes(
        parsed.type
      )
    ) {
      return parsed as InterviewCard;
    }
  } catch {
    // Not JSON — regular system message
  }
  return null;
}

function InterviewCardBubble({
  card,
  at,
  viewerRole,
  onAcceptInterview,
  onDeclineInterview,
}: {
  card: InterviewCard;
  at: string;
  viewerRole?: "company" | "talent";
  onAcceptInterview?: MessagingPanelProps["onAcceptInterview"];
  onDeclineInterview?: MessagingPanelProps["onDeclineInterview"];
}) {
  const [acting, setActing] = useState(false);
  const [actionDone, setActionDone] = useState<"accepted" | "declined" | null>(null);
  const [declineMode, setDeclineMode] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const isInvite = card.type === "interview_invite";
  const isAccepted = card.type === "interview_accepted";
  const isDeclined = card.type === "interview_declined";

  const canAct =
    viewerRole === "talent" &&
    isInvite &&
    !!card.invitation_id &&
    !actionDone;

  const borderCls = isAccepted || actionDone === "accepted"
    ? "border-accent/30"
    : isDeclined || actionDone === "declined"
    ? "border-red-500/30"
    : "border-amber-500/30";
  const bgCls = isAccepted || actionDone === "accepted"
    ? "bg-accent/5"
    : isDeclined || actionDone === "declined"
    ? "bg-red-500/5"
    : "bg-amber-500/5";

  async function handleAccept(dateIso: string) {
    if (!onAcceptInterview || !card.invitation_id) return;
    setActing(true);
    setActionError(null);
    try {
      const res = await onAcceptInterview(card.invitation_id, dateIso);
      if (res?.ok) {
        setActionDone("accepted");
      } else {
        setActionError(res?.message ?? "Failed to accept.");
      }
    } catch {
      setActionError("Something went wrong.");
    } finally {
      setActing(false);
    }
  }

  async function handleDecline() {
    if (!onDeclineInterview || !card.invitation_id) return;
    setActing(true);
    setActionError(null);
    try {
      const res = await onDeclineInterview(card.invitation_id, declineReason.trim() || undefined);
      if (res?.ok) {
        setActionDone("declined");
        setDeclineMode(false);
      } else {
        setActionError(res?.message ?? "Failed to decline.");
      }
    } catch {
      setActionError("Something went wrong.");
    } finally {
      setActing(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="my-3 mx-auto max-w-md"
    >
      <div
        className={cn(
          "overflow-hidden rounded-2xl border",
          borderCls,
          bgCls
        )}
      >
        {/* Card header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-edge/30">
          {isInvite && !actionDone && (
            <>
              <CalendarClock className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-semibold text-amber-600 font-raleway">
                Interview Invitation
              </span>
            </>
          )}
          {(isAccepted || actionDone === "accepted") && (
            <>
              <CheckCheck className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold text-accent font-raleway">
                Interview Confirmed
              </span>
            </>
          )}
          {(isDeclined || actionDone === "declined") && (
            <>
              <X className="h-4 w-4 text-red-500" />
              <span className="text-xs font-semibold text-red-500 font-raleway">
                Interview Declined
              </span>
            </>
          )}
        </div>

        <div className="px-4 py-3 space-y-2.5">
          {/* Job title */}
          <p className="text-sm font-semibold text-heading font-raleway">
            {card.job_title}
          </p>

          {/* Proposed dates (invite) — talent can click to accept */}
          {isInvite && !actionDone && card.proposed_dates && card.proposed_dates.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
                {canAct ? "Pick a time to accept" : "Proposed times"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {card.proposed_dates.map((d, i) => {
                  const date = new Date(d);
                  const label = `${date.toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })} at ${date.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`;
                  return canAct ? (
                    <button
                      key={i}
                      type="button"
                      disabled={acting}
                      onClick={() => handleAccept(d)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-2.5 py-1.5 text-[11px] font-semibold text-accent transition-all hover:bg-accent hover:text-white hover:border-accent disabled:opacity-50 font-raleway"
                    >
                      <CalendarClock className="h-3 w-3" />
                      {label}
                    </button>
                  ) : (
                    <div
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-surface/60 border border-edge/40 px-2.5 py-1 text-[11px] font-medium text-heading font-raleway"
                    >
                      <CalendarClock className="h-3 w-3 text-amber-500" />
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Accepted date */}
          {(isAccepted || actionDone === "accepted") && (card.accepted_date || actionDone) && (
            <div className="flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/20 px-3 py-2">
              <CheckCheck className="h-4 w-4 text-accent shrink-0" />
              <span className="text-xs font-semibold text-accent font-raleway">
                {actionDone === "accepted"
                  ? "You accepted this invitation!"
                  : card.accepted_date
                  ? `${new Date(card.accepted_date).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })} at ${new Date(card.accepted_date).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : "Confirmed"}
              </span>
            </div>
          )}

          {/* Talent action buttons — decline / propose new time */}
          {canAct && !declineMode && (
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={acting}
                onClick={() => setDeclineMode(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-1.5 text-[11px] font-semibold text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50 font-raleway"
              >
                <X className="h-3 w-3" />
                Decline
              </button>
            </div>
          )}

          {/* Decline form */}
          {canAct && declineMode && (
            <div className="space-y-2 pt-1">
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Reason or suggest another time (optional)…"
                rows={2}
                className="w-full resize-none rounded-lg border border-edge bg-surface px-3 py-2 text-xs text-heading placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 font-raleway"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={acting}
                  onClick={handleDecline}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 font-raleway"
                >
                  {acting ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                  Confirm decline
                </button>
                <button
                  type="button"
                  onClick={() => { setDeclineMode(false); setDeclineReason(""); }}
                  className="text-[11px] font-medium text-body hover:text-heading font-raleway"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {actionDone === "declined" && (
            <p className="text-xs text-red-500/80 font-raleway">
              You declined this invitation.
            </p>
          )}

          {/* Error */}
          {actionError && (
            <p className="text-[11px] text-red-500 font-raleway">
              {actionError}
            </p>
          )}

          {/* Message */}
          {card.message && (
            <p className="text-xs text-body font-raleway italic">
              &ldquo;{card.message}&rdquo;
            </p>
          )}

          {/* Decline reason */}
          {isDeclined && card.reason && (
            <p className="text-xs text-red-500/80 font-raleway italic">
              Reason: {card.reason}
            </p>
          )}

          {/* Timestamp */}
          <p className="text-[10px] text-subtle font-jetbrains">
            {formatMessageTime(at)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
