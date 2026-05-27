"use client";

import { useCallback } from "react";
import MessagingPanelLive from "@/components/messaging/MessagingPanelLive";
import type { Thread } from "@/components/messaging/types";
import {
  acceptInvitation,
  declineInvitation,
} from "@/app/actions/interview-invitations";

interface Props {
  threads: Thread[];
  viewerUserId: string;
  viewerName: string;
  viewerInitials: string;
  initialThreadId?: string;
}

export default function TalentMessagesClient({
  threads,
  viewerUserId,
  viewerName,
  viewerInitials,
  initialThreadId,
}: Props) {
  const handleAcceptInterview = useCallback(
    async (invitationId: string, selectedDate: string) => {
      const result = await acceptInvitation({
        invitation_id: invitationId,
        selected_date: selectedDate,
      });
      return result;
    },
    []
  );

  const handleDeclineInterview = useCallback(
    async (invitationId: string, reason?: string) => {
      const result = await declineInvitation({
        invitation_id: invitationId,
        reason,
      });
      return result;
    },
    []
  );

  return (
    <MessagingPanelLive
      initialThreads={threads}
      viewerUserId={viewerUserId}
      title="Messages"
      description="Message the Veloraa team and hiring companies you're connected with."
      viewer={{ name: viewerName, initials: viewerInitials }}
      viewerRole="talent"
      onAcceptInterview={handleAcceptInterview}
      onDeclineInterview={handleDeclineInterview}
      emptyThreadCopy={{
        title: "No conversations yet",
        body: "When you're in the talent pool, the Veloraa team and hiring partners can reach you here. Your Veloraa thread appears as soon as you're live.",
      }}
      initialThreadId={initialThreadId}
    />
  );
}
