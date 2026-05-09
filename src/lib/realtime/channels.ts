"use client";

import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PostgresChange<T extends Record<string, unknown> = Record<string, unknown>> =
  RealtimePostgresChangesPayload<T>;

export type ChangeHandler<T extends Record<string, unknown> = Record<string, unknown>> = (
  payload: PostgresChange<T>
) => void;

export interface UserChannelHandlers {
  onMessage?: ChangeHandler;
  onThread?: ChangeHandler;
  onTalentApp?: ChangeHandler;
  onCompanyApp?: ChangeHandler;
  onInvitation?: ChangeHandler;
  onRecommendation?: ChangeHandler;
  onNotification?: ChangeHandler;
}

export interface AdminChannelHandlers {
  onTalentApp?: ChangeHandler;
  onCompanyApp?: ChangeHandler;
  onJob?: ChangeHandler;
}

// ---------------------------------------------------------------------------
// Subscribe to the user:{userId} channel
// ---------------------------------------------------------------------------

export function subscribeUserChannel(
  userId: string,
  handlers: UserChannelHandlers
): RealtimeChannel {
  const supabase = createClient();

  const channel = supabase.channel(`user:${userId}`);

  // Messages INSERT — new messages in threads the user participates in.
  // RLS ensures only threads the user is a participant are delivered.
  if (handlers.onMessage) {
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      handlers.onMessage
    );
  }

  // Message threads INSERT — new thread created.
  if (handlers.onThread) {
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "message_threads" },
      handlers.onThread
    );
  }

  // Talent application UPDATE — review decisions, profile update outcomes.
  if (handlers.onTalentApp) {
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "talent_applications",
        filter: `user_id=eq.${userId}`,
      },
      handlers.onTalentApp
    );
  }

  // Company application UPDATE — approval, subscription transitions.
  if (handlers.onCompanyApp) {
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "company_applications",
        filter: `user_id=eq.${userId}`,
      },
      handlers.onCompanyApp
    );
  }

  // Interview invitations INSERT + UPDATE.
  if (handlers.onInvitation) {
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "interview_invitations",
        filter: `talent_user_id=eq.${userId}`,
      },
      handlers.onInvitation
    );
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "interview_invitations",
        filter: `talent_user_id=eq.${userId}`,
      },
      handlers.onInvitation
    );
  }

  // Job recommendations INSERT.
  if (handlers.onRecommendation) {
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "job_recommendations",
        filter: `talent_user_id=eq.${userId}`,
      },
      handlers.onRecommendation
    );
  }

  // Notifications INSERT.
  if (handlers.onNotification) {
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      handlers.onNotification
    );
  }

  channel.subscribe();
  return channel;
}

// ---------------------------------------------------------------------------
// Subscribe to the admin:queue channel (unfiltered — RLS gates delivery)
// ---------------------------------------------------------------------------

export function subscribeAdminChannel(
  handlers: AdminChannelHandlers
): RealtimeChannel {
  const supabase = createClient();

  const channel = supabase.channel("admin:queue");

  if (handlers.onTalentApp) {
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "talent_applications" },
      handlers.onTalentApp
    );
    channel.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "talent_applications" },
      handlers.onTalentApp
    );
  }

  if (handlers.onCompanyApp) {
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "company_applications" },
      handlers.onCompanyApp
    );
    channel.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "company_applications" },
      handlers.onCompanyApp
    );
  }

  if (handlers.onJob) {
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "company_jobs" },
      handlers.onJob
    );
    channel.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "company_jobs" },
      handlers.onJob
    );
  }

  channel.subscribe();
  return channel;
}

// ---------------------------------------------------------------------------
// Subscribe to company-side invitations (company sees talent accept/decline)
// ---------------------------------------------------------------------------

export function subscribeCompanyInvitations(
  companyUserId: string,
  onInvitation: ChangeHandler
): RealtimeChannel {
  const supabase = createClient();

  const channel = supabase
    .channel(`company-invitations:${companyUserId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "interview_invitations",
        filter: `company_user_id=eq.${companyUserId}`,
      },
      onInvitation
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "interview_invitations",
        filter: `company_user_id=eq.${companyUserId}`,
      },
      onInvitation
    );

  channel.subscribe();
  return channel;
}
