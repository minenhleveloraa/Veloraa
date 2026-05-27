"use client";

import { useCallback } from "react";
import MessagingPanelLive from "@/components/messaging/MessagingPanelLive";
import type { CompanyJobOption } from "@/components/messaging/MessagingPanel";
import type { Thread } from "@/components/messaging/types";
import { sendInterviewInvite } from "@/app/actions/interview-invitations";

interface Props {
  threads: Thread[];
  viewerUserId: string;
  viewerName: string;
  viewerInitials: string;
  companyJobs: CompanyJobOption[];
  initialThreadId?: string;
}

export default function CompanyMessagesClient({
  threads,
  viewerUserId,
  viewerName,
  viewerInitials,
  companyJobs,
  initialThreadId,
}: Props) {
  const handleScheduleInterview = useCallback(
    async (
      _threadId: string,
      talentUserId: string,
      data: { jobId: string; dates: string[]; message?: string }
    ) => {
      const result = await sendInterviewInvite({
        job_id: data.jobId,
        talent_user_id: talentUserId,
        proposed_dates: data.dates,
        message: data.message,
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
      description="Talk to the Veloraa team and the candidates we match you with."
      viewer={{ name: viewerName, initials: viewerInitials }}
      scheduleKinds={["candidate"]}
      viewerRole="company"
      companyJobs={companyJobs}
      onScheduleInterview={handleScheduleInterview}
      emptyThreadCopy={{
        title: "Pick a conversation",
        body: "Start with the Veloraa team on the left — they'll help you get the most out of the platform.",
      }}
      initialThreadId={initialThreadId}
    />
  );
}
