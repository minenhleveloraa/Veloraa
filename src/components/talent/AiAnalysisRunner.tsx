"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  FileSearch,
  ListChecks,
  Sparkles,
  AlertCircle,
  RotateCw,
  Check,
} from "lucide-react";
import { runAiAnalysis } from "@/app/actions/ai-analysis";

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const STEPS = [
  {
    key: "read",
    label: "Reading your resume",
    detail: "Parsing the PDF and extracting key signals.",
    icon: FileSearch,
  },
  {
    key: "experience",
    label: "Analyzing your experience",
    detail: "Mapping roles, scope, and progression.",
    icon: BrainCircuit,
  },
  {
    key: "skills",
    label: "Evaluating your skills",
    detail: "Grounding each claim in resume evidence.",
    icon: ListChecks,
  },
  {
    key: "profile",
    label: "Generating your profile",
    detail: "Writing the summary and scoring dimensions.",
    icon: Sparkles,
  },
] as const;

export default function AiAnalysisRunner({
  initialError,
}: {
  initialError: string | null;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);

  const stopTimer = () => {
    if (stepTimer.current) {
      clearInterval(stepTimer.current);
      stepTimer.current = null;
    }
  };

  const start = useCallback(async () => {
    if (running) return;
    setError(null);
    setRunning(true);
    setCompleted(false);
    setActiveStep(0);

    // Cycle through the four visible "thinking" steps while the model
    // is actually working in the background.
    stopTimer();
    stepTimer.current = setInterval(() => {
      setActiveStep((i) => (i < STEPS.length - 1 ? i + 1 : i));
    }, 2400);

    const res = await runAiAnalysis();
    stopTimer();

    if (!res.ok) {
      setRunning(false);
      setError(res.message ?? "Something went wrong.");
      return;
    }

    // Flash "complete" then let the server page re-render with results.
    setActiveStep(STEPS.length - 1);
    setCompleted(true);
    setTimeout(() => {
      router.refresh();
    }, 900);
  }, [router, running]);

  // Auto-start on first mount unless we landed here after a failure.
  useEffect(() => {
    if (startedRef.current) return;
    if (initialError) return;
    startedRef.current = true;
    const timeoutId = window.setTimeout(() => {
      void start();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [start, initialError]);

  useEffect(() => () => stopTimer(), []);

  // ------------------------------------------------------------
  // Failure state — retry UI.
  // ------------------------------------------------------------
  if (error && !running) {
    return (
      <div className="w-full max-w-xl rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-heading font-raleway">
          Analysis failed
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-body font-raleway">
          {error}
        </p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            void start();
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-btn-bg px-6 py-2.5 text-sm font-semibold text-btn-fg transition-opacity hover:opacity-90 font-raleway"
        >
          <RotateCw className="h-4 w-4" />
          Retry analysis
        </button>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Running / loading state.
  // ------------------------------------------------------------
  return (
    <div className="w-full max-w-xl text-center">
      <div className="mb-8 flex justify-center">
        <PulseOrb completed={completed} />
      </div>

      <span className="mb-3 inline-block text-xs uppercase tracking-[0.08em] text-accent font-jetbrains">
        Stage 2 · AI analysis
      </span>
      <h1 className="text-3xl font-bold text-heading sm:text-4xl font-raleway">
        {completed ? (
          <>
            Analysis <span className="text-accent">complete</span>
          </>
        ) : (
          <>
            Reading between <span className="text-accent">the lines…</span>
          </>
        )}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-body font-libre italic">
        Our AI is grading your application against thousands of senior
        engineers. Usually takes 15-30 seconds.
      </p>

      {/* Step list */}
      <ul className="mx-auto mt-10 w-full max-w-md space-y-2 text-left">
        {STEPS.map((s, i) => {
          const state =
            completed || i < activeStep
              ? "done"
              : i === activeStep
              ? "active"
              : "pending";
          const Icon = s.icon;
          return (
            <li
              key={s.key}
              className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                state === "active"
                  ? "border-accent bg-accent/5"
                  : state === "done"
                  ? "border-edge bg-surface"
                  : "border-edge bg-surface opacity-60"
              }`}
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  state === "done"
                    ? "bg-accent text-white"
                    : state === "active"
                    ? "bg-pill-bg text-accent"
                    : "bg-pill-bg text-subtle"
                }`}
              >
                {state === "done" ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : state === "active" ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                  >
                    <Icon className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-heading font-raleway">
                  {s.label}
                </p>
                <AnimatePresence mode="wait">
                  {(state === "active" || state === "done") && (
                    <motion.p
                      key={state}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: EASE_OUT }}
                      className="mt-0.5 text-xs text-body font-raleway"
                    >
                      {s.detail}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------
// Pulsing orb — decorative header for the loading state.
// ---------------------------------------------------------------------

function PulseOrb({ completed }: { completed: boolean }) {
  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <motion.span
        className="absolute inset-0 rounded-full bg-accent/20"
        animate={{
          scale: completed ? [1, 1.15, 1] : [1, 1.35, 1],
          opacity: completed ? [0.5, 0.8, 0.5] : [0.4, 0.2, 0.4],
        }}
        transition={{
          duration: completed ? 0.8 : 2.2,
          repeat: completed ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.span
        className="absolute inset-3 rounded-full bg-accent/30"
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.3, 0.6] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-[0_0_40px_rgba(74,222,128,0.4)]">
        {completed ? (
          <Check className="h-5 w-5" strokeWidth={3} />
        ) : (
          <Sparkles className="h-5 w-5" />
        )}
      </span>
    </div>
  );
}
