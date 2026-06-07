"use client";

import { useState } from "react";
import {
  Sparkles,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Copy,
  Check,
  ArrowUpRight,
} from "lucide-react";
import VelscreenReportModal from "./VelscreenReportModal";
import type { VelscreenReportPayload } from "@/lib/types/db";

interface VelscreenReportSectionProps {
  candidateName: string;
  roleType: string;
  report: VelscreenReportPayload | null;
  interviewUrl: string | null;
  completedAt: string | null;
}

export default function VelscreenReportSection({
  candidateName,
  roleType,
  report,
  interviewUrl,
  completedAt,
}: VelscreenReportSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // If Velscreen wasn't even initiated, do not render this section.
  if (!interviewUrl && !report) {
    return null;
  }

  const handleCopyLink = async () => {
    if (!interviewUrl) return;
    try {
      await navigator.clipboard.writeText(interviewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const getRecStyles = (rec: "advance" | "hold" | "decline") => {
    switch (rec) {
      case "advance":
        return {
          label: "Advance",
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-500",
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        };
      case "hold":
        return {
          label: "Hold / Reserve",
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-500",
          icon: <HelpCircle className="h-3.5 w-3.5" />,
        };
      case "decline":
        return {
          label: "Decline",
          bg: "bg-rose-500/10 border-rose-500/30 text-rose-500",
          icon: <XCircle className="h-3.5 w-3.5" />,
        };
      default:
        return {
          label: rec,
          bg: "bg-edge/10 border-edge/30 text-body",
          icon: <HelpCircle className="h-3.5 w-3.5" />,
        };
    }
  };

  return (
    <div className="rounded-2xl border border-edge bg-surface p-5 sm:p-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-accent font-jetbrains font-semibold">
            <Sparkles className="h-3 w-3" />
            Velscreen AI Integration
          </span>
          <h2 className="mt-2 text-lg font-bold text-heading font-raleway">
            AI Interview Assessment
          </h2>
        </div>

        {report && (
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-accent font-jetbrains">
            <CheckCircle2 className="h-3 w-3" />
            Complete
          </span>
        )}
        {!report && interviewUrl && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-amber-600 font-jetbrains animate-pulse">
            <Clock className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
            Pending Response
          </span>
        )}
      </header>

      {report ? (
        /* Completed Report summary card */
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-edge bg-page-alt p-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {/* Score */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains font-semibold">
                AI Score
              </p>
              <p className="text-2xl font-bold text-heading font-raleway mt-0.5">
                {report.scores.overall}
                <span className="text-xs text-subtle font-jetbrains font-normal ml-0.5">
                  / 100
                </span>
              </p>
            </div>

            {/* Divider */}
            <div className="hidden sm:block h-8 w-px bg-edge" />

            {/* AI Recommendation */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains font-semibold mb-1">
                AI Recommendation
              </p>
              <div
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase font-jetbrains ${
                  getRecStyles(report.recommendation).bg
                }`}
              >
                {getRecStyles(report.recommendation).icon}
                {getRecStyles(report.recommendation).label}
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block h-8 w-px bg-edge" />

            {/* Date completed */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains font-semibold">
                Completed At
              </p>
              <p className="text-xs text-body font-jetbrains mt-1">
                {completedAt ? new Date(completedAt).toLocaleDateString() : new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_24px_rgba(74,222,128,0.35)] font-raleway cursor-pointer"
          >
            View Full Report &amp; Transcript
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* Pending Interview Card with copyable direct link */
        <div className="rounded-xl border border-edge bg-page-alt p-4">
          <p className="text-xs text-body font-raleway leading-relaxed">
            The candidate has been invited to complete their AI interview. If they did not receive the email or need their link resent, copy it below.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <div className="w-full truncate rounded-lg border border-edge bg-surface px-3 py-2 text-xs text-subtle font-jetbrains select-all">
              {interviewUrl}
            </div>
            
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-edge bg-surface text-heading transition-colors hover:bg-page-alt"
              title="Copy link"
            >
              {copied ? (
                <Check className="h-4 w-4 text-accent" />
              ) : (
                <Copy className="h-4 w-4 text-body" />
              )}
            </button>

            <a
              href={interviewUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-edge bg-surface text-heading transition-colors hover:bg-page-alt"
              title="Open interview in sandbox / new tab"
            >
              <ExternalLink className="h-4 w-4 text-body" />
            </a>
          </div>
        </div>
      )}

      {/* Report Modal Component */}
      {report && (
        <VelscreenReportModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          candidateName={candidateName}
          roleType={roleType}
          report={report}
        />
      )}
    </div>
  );
}
