"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  MessageSquare,
  Cpu,
  Calendar,
  User,
  HelpCircle,
} from "lucide-react";
import type { VelscreenReportPayload } from "@/lib/types/db";

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

interface VelscreenReportModalProps {
  open: boolean;
  onClose: () => void;
  candidateName: string;
  roleType: string;
  report: VelscreenReportPayload;
}

export default function VelscreenReportModal({
  open,
  onClose,
  candidateName,
  roleType,
  report,
}: VelscreenReportModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <VelscreenReportModalBody
          onClose={onClose}
          candidateName={candidateName}
          roleType={roleType}
          report={report}
        />
      )}
    </AnimatePresence>
  );
}

function VelscreenReportModalBody({
  onClose,
  candidateName,
  roleType,
  report,
}: Omit<VelscreenReportModalProps, "open">) {
  const [activeTab, setActiveTab] = useState<"summary" | "transcript">("summary");

  const { scores, summary, strengths, concerns, recommendation, transcript, model, completed_at } = report;

  // Helper for recommendation styling
  const getRecStyles = (rec: typeof recommendation) => {
    switch (rec) {
      case "advance":
        return {
          label: "Advance",
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-500",
          icon: <CheckCircle2 className="h-4 w-4" />,
        };
      case "hold":
        return {
          label: "Hold / Reserve",
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-500",
          icon: <HelpCircle className="h-4 w-4" />,
        };
      case "decline":
        return {
          label: "Decline",
          bg: "bg-rose-500/10 border-rose-500/30 text-rose-500",
          icon: <XCircle className="h-4 w-4" />,
        };
      default:
        return {
          label: rec,
          bg: "bg-edge/10 border-edge/30 text-body",
          icon: <HelpCircle className="h-4 w-4" />,
        };
    }
  };

  const recStyle = getRecStyles(recommendation);

  // Helper for percentage progress bar width
  const percent = (val: number, max: number) => {
    return `${Math.min(100, Math.max(0, (val / max) * 100))}%`;
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ scale: 0.95, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 15, opacity: 0 }}
        transition={{ duration: 0.25, ease: EASE_OUT }}
        className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-3xl border border-edge bg-surface shadow-2xl overflow-hidden font-raleway text-heading"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-edge bg-page-alt p-6">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-accent font-jetbrains font-semibold">
              <Sparkles className="h-3 w-3" />
              AI Interview Report
            </span>
            <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl text-heading">
              {candidateName}
            </h2>
            <p className="mt-1 text-xs text-body font-medium">
              Applied for: <span className="text-heading font-semibold">{roleType}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 ml-4">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains font-semibold">
                Completed
              </span>
              <span className="text-xs text-body font-jetbrains mt-0.5">
                {new Date(completed_at).toLocaleString()}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-edge bg-surface text-body transition-colors hover:bg-page-alt hover:text-heading"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-edge bg-surface px-6 pt-2">
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] border-b-2 transition-all font-jetbrains ${
              activeTab === "summary"
                ? "border-accent text-accent"
                : "border-transparent text-body hover:text-heading"
            }`}
          >
            <FileText className="h-4 w-4" />
            Evaluation Summary
          </button>
          <button
            onClick={() => setActiveTab("transcript")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] border-b-2 transition-all font-jetbrains ${
              activeTab === "transcript"
                ? "border-accent text-accent"
                : "border-transparent text-body hover:text-heading"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Interview Transcript
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface custom-scrollbar">
          {activeTab === "summary" ? (
            <div className="space-y-6">
              {/* Top Overview Cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Overall Score Circle */}
                <div className="flex flex-col items-center justify-center rounded-2xl border border-edge bg-page-alt p-5 text-center">
                  <span className="text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains font-semibold">
                    Overall Score
                  </span>
                  <div className="relative mt-3 flex h-24 w-24 items-center justify-center">
                    {/* SVG Circular Progress */}
                    <svg className="absolute inset-0 h-full w-full -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        className="stroke-edge fill-none"
                        strokeWidth="8"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        className="stroke-accent fill-none transition-all duration-1000"
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - scores.overall / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-2xl font-bold text-heading font-raleway">
                      {scores.overall}
                      <span className="text-xs text-subtle font-jetbrains">/100</span>
                    </span>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="flex flex-col items-center justify-center rounded-2xl border border-edge bg-page-alt p-5 text-center">
                  <span className="text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains font-semibold">
                    Recommendation
                  </span>
                  <div
                    className={`mt-4 inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold tracking-wide uppercase font-jetbrains ${recStyle.bg}`}
                  >
                    {recStyle.icon}
                    {recStyle.label}
                  </div>
                  <span className="text-[11px] text-body mt-3">
                    Decision lives on Veloraa
                  </span>
                </div>

                {/* Integration Info */}
                <div className="flex flex-col justify-center rounded-2xl border border-edge bg-page-alt p-5">
                  <div className="space-y-2.5 text-xs text-body font-raleway">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-accent shrink-0" />
                      <span>Model: <strong className="text-heading font-jetbrains">{model || "GPT-4o-mini"}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-accent shrink-0" />
                      <span>Completed: <strong className="text-heading font-jetbrains">{new Date(completed_at).toLocaleDateString()}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-accent shrink-0" />
                      <span>Total weight scale: 100 pts</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Paragraph */}
              <div className="rounded-2xl border border-edge bg-surface p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-subtle font-jetbrains mb-3">
                  AI Evaluation Executive Summary
                </h3>
                <p className="text-sm leading-relaxed text-body whitespace-pre-wrap font-raleway">
                  {summary}
                </p>
              </div>

              {/* Dimension Score Details */}
              <div className="rounded-2xl border border-edge bg-surface p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-subtle font-jetbrains mb-4">
                  Dimension Breakdown
                </h3>
                <div className="space-y-4">
                  {/* Technical Depth */}
                  <DimensionProgress
                    label="Technical Depth"
                    val={scores.technical_depth}
                    max={30}
                    percentWidth={percent(scores.technical_depth, 30)}
                    desc="Confidence, specificity, technical trade-offs, and deep expertise."
                  />
                  {/* Problem Solving */}
                  <DimensionProgress
                    label="Problem Solving"
                    val={scores.problem_solving}
                    max={25}
                    percentWidth={percent(scores.problem_solving, 25)}
                    desc="Systematic reasoning, edge cases, constraint management."
                  />
                  {/* Communication Clarity */}
                  <DimensionProgress
                    label="Communication Clarity"
                    val={scores.communication}
                    max={20}
                    percentWidth={percent(scores.communication, 20)}
                    desc="Structured answers, context/action/result flow, brevity."
                  />
                  {/* Ownership & Accountability */}
                  <DimensionProgress
                    label="Ownership & Accountability"
                    val={scores.ownership}
                    max={15}
                    percentWidth={percent(scores.ownership, 15)}
                    desc="First-person contribution, taking responsibility, personal mistakes."
                  />
                  {/* Self-Awareness & Growth */}
                  <DimensionProgress
                    label="Self-Awareness & Growth"
                    val={scores.self_awareness}
                    max={10}
                    percentWidth={percent(scores.self_awareness, 10)}
                    desc="Acknowledge limitations, learning outcomes, growth path."
                  />
                </div>
              </div>

              {/* Strengths & Concerns */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Strengths */}
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-emerald-500 font-jetbrains mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Observed Strengths
                  </h3>
                  {strengths && strengths.length > 0 ? (
                    <ul className="space-y-2 text-xs leading-relaxed text-heading list-disc pl-4 font-raleway">
                      {strengths.map((str, idx) => (
                        <li key={idx}>{str}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-subtle font-raleway italic">No notable strengths compiled.</p>
                  )}
                </div>

                {/* Concerns */}
                <div className="rounded-2xl border-rose-500/20 bg-rose-500/5 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-rose-500 font-jetbrains mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    Observed Red Flags / Concerns
                  </h3>
                  {concerns && concerns.length > 0 ? (
                    <ul className="space-y-2 text-xs leading-relaxed text-heading list-disc pl-4 font-raleway">
                      {concerns.map((con, idx) => (
                        <li key={idx}>{con}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-subtle font-raleway italic">No red flags or major concerns identified.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Transcript Chat View */
            <div className="space-y-6">
              <div className="rounded-xl border border-edge bg-page-alt p-3 text-center text-xs text-body font-jetbrains">
                The conversation transcript below represents the candidate&apos;s raw adaptive AI dialogue.
              </div>
              <div className="space-y-4">
                {transcript.map((msg, idx) => {
                  const isAI = msg.role === "assistant";
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isAI ? "items-start" : "items-end"}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-subtle font-jetbrains font-semibold uppercase mb-1">
                        {isAI ? (
                          <>
                            <Cpu className="h-3 w-3 text-accent" />
                            Velscreen AI Interviewer
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3 text-body" />
                            {candidateName}
                          </>
                        )}
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl border p-4 text-sm leading-relaxed ${
                          isAI
                            ? "bg-page-alt border-edge text-heading rounded-tl-none font-raleway"
                            : "bg-accent/5 border-accent/20 text-heading rounded-tr-none font-raleway"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end items-center border-t border-edge bg-page-alt p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-edge bg-surface px-4 py-2 text-xs font-semibold text-heading hover:bg-page-alt transition-colors font-raleway"
          >
            Close Report
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface DimensionProgressProps {
  label: string;
  val: number;
  max: number;
  percentWidth: string;
  desc: string;
}

function DimensionProgress({ label, val, max, percentWidth, desc }: DimensionProgressProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-heading font-raleway">{label}</span>
        <span className="font-bold text-heading font-jetbrains">
          {val} <span className="text-subtle font-normal font-jetbrains">/ {max}</span>
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-edge overflow-hidden">
        <div
          style={{ width: percentWidth }}
          className="h-full rounded-full bg-accent transition-all duration-500"
        />
      </div>
      <p className="text-[10px] text-subtle font-raleway mt-0.5">{desc}</p>
    </div>
  );
}
