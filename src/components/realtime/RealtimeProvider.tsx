"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  subscribeUserChannel,
  subscribeAdminChannel,
  type ChangeHandler,
} from "@/lib/realtime/channels";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface RealtimeCtx {
  messagesUnread: number;
  /** Register a callback for a specific table change. Returns unsubscribe fn. */
  onChange: (table: string, cb: ChangeHandler) => () => void;
}

const RealtimeContext = createContext<RealtimeCtx>({
  messagesUnread: 0,
  onChange: () => () => {},
});

export function useRealtime() {
  return useContext(RealtimeContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export default function RealtimeProvider({
  children,
  userId,
  initialMessagesUnread = 0,
  kind = "user",
}: {
  children: React.ReactNode;
  userId: string;
  initialMessagesUnread?: number;
  kind?: "user" | "admin";
}) {
  const router = useRouter();
  const [messagesUnreadState, setMessagesUnreadState] = useState({
    base: initialMessagesUnread,
    value: initialMessagesUnread,
  });
  const messagesUnread =
    messagesUnreadState.base === initialMessagesUnread
      ? messagesUnreadState.value
      : initialMessagesUnread;

  // Table-specific listener registry: table name → Set of callbacks
  const listenersRef = useRef<Map<string, Set<ChangeHandler>>>(new Map());

  const dispatch = useCallback((table: string, payload: unknown) => {
    const set = listenersRef.current.get(table);
    if (!set) return;
    for (const cb of set) {
      try {
        cb(payload as Parameters<ChangeHandler>[0]);
      } catch {
        // Individual listener errors must not crash the provider.
      }
    }
  }, []);

  const onChange = useCallback(
    (table: string, cb: ChangeHandler): (() => void) => {
      if (!listenersRef.current.has(table)) {
        listenersRef.current.set(table, new Set());
      }
      listenersRef.current.get(table)!.add(cb);
      return () => {
        listenersRef.current.get(table)?.delete(cb);
      };
    },
    []
  );

  // ---------------------------------------------------
  // Open the channel once per mount
  // ---------------------------------------------------
  useEffect(() => {
    const supabase = createClient();

    const channel =
      kind === "admin"
        ? subscribeAdminChannel({
            onTalentApp: (p) => dispatch("talent_applications", p),
            onCompanyApp: (p) => dispatch("company_applications", p),
            onJob: (p) => dispatch("company_jobs", p),
          })
        : subscribeUserChannel(userId, {
            onMessage: (p) => {
              dispatch("messages", p);
              // Bump the global unread counter for new messages.
              // We only count INSERT events from other users.
              if (
                p.eventType === "INSERT" &&
                (p.new as Record<string, unknown>)?.sender_id !== userId
              ) {
                setMessagesUnreadState((prev) => {
                  const value =
                    prev.base === initialMessagesUnread
                      ? prev.value
                      : initialMessagesUnread;
                  return {
                    base: initialMessagesUnread,
                    value: value + 1,
                  };
                });
              }
            },
            onThread: (p) => {
              dispatch("message_threads", p);
            },
            onTalentApp: (p) => dispatch("talent_applications", p),
            onCompanyApp: (p) => dispatch("company_applications", p),
            onInvitation: (p) => dispatch("interview_invitations", p),
            onRecommendation: (p) => dispatch("job_recommendations", p),
            onNotification: (p) => dispatch("notifications", p),
          });

    // Visibility change handler: when the tab returns from hidden, do a
    // soft server refresh so SSR re-hydrates the authoritative state. This
    // covers edge cases like JWT rotation during sleep.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [userId, kind, dispatch, router, initialMessagesUnread]);

  return (
    <RealtimeContext.Provider value={{ messagesUnread, onChange }}>
      {children}
    </RealtimeContext.Provider>
  );
}
