"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MessagingPanel, { type MessagingPanelProps } from "./MessagingPanel";
import type { Message, Thread } from "./types";
import { markThreadRead, sendMessage } from "@/app/actions/messages";

// ---------------------------------------------------------------------------
// Public props
// ---------------------------------------------------------------------------

export interface MessagingPanelLiveProps
  extends Omit<MessagingPanelProps, "threads" | "onSendMessage" | "onOpenThread"> {
  /** Server-hydrated threads (pre-sorted; panel re-sorts defensively). */
  initialThreads: Thread[];
  /** The viewer's auth uid — used for sender_user_id comparisons. */
  viewerUserId: string;
  /** Whether the viewer is an admin — toggles fromSelf logic for realtime rows. */
  viewerIsAdmin?: boolean;
}

// ---------------------------------------------------------------------------
// Types mirroring the realtime payload for `public.messages`
// ---------------------------------------------------------------------------

interface RealtimeMessageRow {
  id: string;
  thread_id: string;
  sender_user_id: string | null;
  sender_is_admin: boolean;
  body: string;
  system: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MessagingPanelLive({
  initialThreads,
  viewerUserId,
  viewerIsAdmin = false,
  ...panelProps
}: MessagingPanelLiveProps) {
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // If the server re-renders (e.g. after navigation / revalidate), take the
  // fresh thread list as the new baseline, preserving any optimistic
  // messages that haven't been confirmed yet.
  const lastInitialRef = useRef<Thread[]>(initialThreads);
  useEffect(() => {
    if (lastInitialRef.current === initialThreads) return;
    lastInitialRef.current = initialThreads;
    setThreads((prev) => reconcileServerThreads(initialThreads, prev));
  }, [initialThreads]);

  // -------------------------------------------------------------------------
  // Realtime subscription — new messages + new threads
  // -------------------------------------------------------------------------

  useEffect(() => {
    const channel = supabase
      .channel("messaging-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as RealtimeMessageRow;
          const msg = messageFromRow(row, viewerUserId, viewerIsAdmin);

          setThreads((prev) => {
            const idx = prev.findIndex((t) => t.id === row.thread_id);
            if (idx === -1) {
              // New thread we haven't hydrated yet — trigger a server refresh
              // to pick it up with full counterparty metadata.
              router.refresh();
              return prev;
            }
            const target = prev[idx];
            if (target.messages.some((m) => m.id === msg.id)) return prev;
            // Drop any optimistic twin authored by the viewer (same body, self).
            const filtered = msg.fromSelf
              ? target.messages.filter(
                  (m) =>
                    !(
                      m.id.startsWith("opt-") &&
                      m.fromSelf &&
                      m.body === msg.body
                    )
                )
              : target.messages;
            const updated: Thread = {
              ...target,
              messages: [...filtered, msg],
              lastMessage: row.system ? target.lastMessage : row.body,
              lastMessageAt: row.created_at,
              unread: msg.fromSelf
                ? target.unread ?? 0
                : (target.unread ?? 0) + (row.system ? 0 : 1),
            };
            const next = [...prev];
            next[idx] = updated;
            return next;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "message_threads" },
        () => {
          // New thread — pull the authoritative hydrated list from the server.
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router, viewerUserId, viewerIsAdmin]);

  // -------------------------------------------------------------------------
  // Handlers wired into the presentational panel
  // -------------------------------------------------------------------------

  const handleSendMessage = useCallback(
    async (threadId: string, body: string) => {
      const optimistic: Message = {
        id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        body,
        at: new Date().toISOString(),
        fromSelf: true,
      };

      // Optimistic append
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                messages: [...t.messages, optimistic],
                lastMessage: body,
                lastMessageAt: optimistic.at,
              }
            : t
        )
      );

      try {
        const res = await sendMessage({ threadId, body });
        if (!res.ok) throw new Error(res.error);

        // Replace optimistic id with the real server id to prevent dupes
        // when the realtime event arrives for this insert.
        const serverId = res.data.id;
        setThreads((prev) =>
          prev.map((t) => {
            if (t.id !== threadId) return t;
            return {
              ...t,
              messages: t.messages.map((m) =>
                m.id === optimistic.id ? { ...m, id: serverId } : m
              ),
            };
          })
        );
      } catch (err) {
        console.error("[messaging] send failed:", err);
        // Roll back the optimistic row.
        setThreads((prev) =>
          prev.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: t.messages.filter((m) => m.id !== optimistic.id),
                }
              : t
          )
        );
      }
    },
    []
  );

  const handleOpenThread = useCallback(
    async (threadId: string) => {
      // Optimistically zero the unread badge.
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, unread: 0 } : t))
      );
      try {
        await markThreadRead(threadId);
      } catch (err) {
        console.error("[messaging] markThreadRead failed:", err);
      }
    },
    []
  );

  return (
    <MessagingPanel
      {...panelProps}
      threads={threads}
      onSendMessage={handleSendMessage}
      onOpenThread={handleOpenThread}
    />
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function messageFromRow(
  row: RealtimeMessageRow,
  viewerUserId: string,
  viewerIsAdmin: boolean
): Message {
  const fromSelf = row.system
    ? false
    : viewerIsAdmin
      ? !!row.sender_is_admin
      : row.sender_user_id === viewerUserId;
  return {
    id: row.id,
    body: row.body,
    at: row.created_at,
    fromSelf,
    system: row.system || undefined,
  };
}

/**
 * Merge a fresh server snapshot with the current state. Preserves optimistic
 * messages (ids starting with `opt-`) that the server hasn't confirmed yet,
 * otherwise trusts the server as source of truth.
 */
function reconcileServerThreads(
  server: Thread[],
  current: Thread[]
): Thread[] {
  const currentById = new Map<string, Thread>();
  for (const t of current) currentById.set(t.id, t);

  return server.map((serverThread) => {
    const local = currentById.get(serverThread.id);
    if (!local) return serverThread;

    const serverIds = new Set(serverThread.messages.map((m) => m.id));
    const pendingOptimistic = local.messages.filter(
      (m) => m.id.startsWith("opt-") && !serverIds.has(m.id)
    );
    if (pendingOptimistic.length === 0) return serverThread;

    // Re-sort since the optimistic timestamps are mid-air.
    const merged = [...serverThread.messages, ...pendingOptimistic].sort(
      (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
    );
    return { ...serverThread, messages: merged };
  });
}
