/**
 * Shared types used by the messaging panel. The panel itself is purely
 * presentational today — real persistence/realtime will layer in later
 * against Supabase.
 */

export type ThreadKind = "admin" | "candidate" | "company" | "team";

export interface Message {
  id: string;
  body: string;
  /** ISO string for sorting + relative display. */
  at: string;
  fromSelf: boolean;
  /** System messages render centered without a bubble (e.g. "Conversation started"). */
  system?: boolean;
  /** Optional read receipt. */
  read?: boolean;
}

export interface Thread {
  id: string;
  name: string;
  subtitle?: string | null;
  avatarInitials?: string;
  avatarUrl?: string | null;
  kind: ThreadKind;
  online?: boolean;
  verified?: boolean;
  pinned?: boolean;
  unread?: number;
  lastMessage?: string;
  /** ISO timestamp. */
  lastMessageAt?: string;
  messages: Message[];
  /** When true, composer is read-only and shows `disabledReason`. */
  disabled?: boolean;
  disabledReason?: string;
  /** The talent user id on this thread (company_candidate threads). */
  talentUserId?: string | null;
  /** The company user id on this thread (company_candidate threads). */
  companyUserId?: string | null;
}
