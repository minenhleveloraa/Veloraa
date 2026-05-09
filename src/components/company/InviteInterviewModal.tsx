"use client";

import { useState, useTransition } from "react";
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Send,
  X,
} from "lucide-react";
import { sendInterviewInvite } from "@/app/actions/interview-invitations";

interface Props {
  jobId: string;
  jobTitle: string;
  talentUserId: string;
  talentName: string;
  onClose: () => void;
  onSuccess?: (threadId?: string) => void;
}

export default function InviteInterviewModal({
  jobId,
  jobTitle,
  talentUserId,
  talentName,
  onClose,
  onSuccess,
}: Props) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Calendar state
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState("10");
  const [selectedMinute, setSelectedMinute] = useState("00");

  function addDateSlot() {
    if (!selectedDay || selectedDates.length >= 3) return;
    const d = new Date(selectedDay);
    d.setHours(parseInt(selectedHour), parseInt(selectedMinute), 0, 0);
    // Don't add duplicates
    if (selectedDates.some((s) => s.getTime() === d.getTime())) return;
    setSelectedDates((prev) => [...prev, d]);
    setSelectedDay(null);
  }

  function removeDate(index: number) {
    setSelectedDates((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (selectedDates.length === 0) return;
    setError(null);

    startTransition(async () => {
      const result = await sendInterviewInvite({
        job_id: jobId,
        talent_user_id: talentUserId,
        proposed_dates: selectedDates.map((d) => d.toISOString()),
        message: message.trim() || undefined,
      });

      if (result.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.(result.threadId);
          onClose();
        }, 1500);
      } else {
        setError(result.message);
      }
    });
  }

  // Calendar helpers
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthName = viewMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  function prevMonth() {
    setViewMonth(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setViewMonth(new Date(year, month + 1, 1));
  }

  const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 8).padStart(2, "0")); // 08-19
  const MINUTES = ["00", "15", "30", "45"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-edge bg-surface shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-edge bg-surface px-5 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
              Interview invitation
            </p>
            <h2 className="text-lg font-bold text-heading font-raleway">
              Invite {talentName}
            </h2>
            <p className="text-xs text-body font-raleway">
              for <strong>{jobTitle}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-subtle transition-colors hover:bg-page-alt hover:text-heading"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent">
                <Send className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-heading font-raleway">
                Invitation sent!
              </p>
              <p className="text-xs text-body font-raleway">
                {talentName} will be notified and can respond from their invites page.
              </p>
            </div>
          ) : (
            <>
              {/* Calendar */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains mb-3">
                  <CalendarDays className="inline h-3 w-3 mr-1" />
                  Select up to 3 date/time proposals
                </p>

                {/* Month nav */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="rounded-lg p-1.5 text-subtle hover:bg-page-alt hover:text-heading transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <p className="text-sm font-semibold text-heading font-raleway">
                    {monthName}
                  </p>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="rounded-lg p-1.5 text-subtle hover:bg-page-alt hover:text-heading transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Day grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div
                      key={d}
                      className="text-[10px] uppercase tracking-[0.1em] text-subtle font-jetbrains py-1"
                    >
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = new Date(year, month, i + 1);
                    const isPast = day < today;
                    const isSelected =
                      selectedDay &&
                      day.toDateString() === selectedDay.toDateString();

                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={isPast}
                        onClick={() => setSelectedDay(day)}
                        className={`rounded-lg py-1.5 text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-accent text-white shadow-[0_0_12px_rgba(74,222,128,0.3)]"
                            : isPast
                            ? "text-subtle/40 cursor-not-allowed"
                            : "text-heading hover:bg-accent/10 hover:text-accent"
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Time selector */}
                {selectedDay && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-edge bg-page-alt p-3">
                    <Clock className="h-4 w-4 text-accent shrink-0" />
                    <p className="text-xs text-body font-raleway flex-1">
                      {selectedDay.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <select
                      value={selectedHour}
                      onChange={(e) => setSelectedHour(e.target.value)}
                      className="rounded-lg border border-edge bg-surface px-2 py-1 text-xs text-heading font-jetbrains"
                    >
                      {HOURS.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-subtle">:</span>
                    <select
                      value={selectedMinute}
                      onChange={(e) => setSelectedMinute(e.target.value)}
                      className="rounded-lg border border-edge bg-surface px-2 py-1 text-xs text-heading font-jetbrains"
                    >
                      {MINUTES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addDateSlot}
                      disabled={selectedDates.length >= 3}
                      className="rounded-lg bg-accent px-3 py-1 text-[11px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 font-raleway"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Selected dates */}
              {selectedDates.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
                    Proposed slots ({selectedDates.length}/3)
                  </p>
                  {selectedDates.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl border border-accent/20 bg-accent/5 px-3 py-2"
                    >
                      <Calendar className="h-4 w-4 text-accent shrink-0" />
                      <span className="flex-1 text-sm font-medium text-heading font-raleway">
                        {d.toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}{" "}
                        at{" "}
                        {d.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeDate(i)}
                        className="rounded-lg p-1 text-subtle hover:text-red-500 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Message */}
              <div>
                <label className="text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
                  Message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Hi! We'd love to discuss the role with you…"
                  className="mt-1.5 w-full resize-y rounded-lg border border-edge bg-page-alt px-4 py-2.5 text-sm text-heading placeholder:text-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 font-raleway"
                />
              </div>

              {error && (
                <p className="text-xs text-red-500 font-raleway">{error}</p>
              )}

              {/* Submit */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={selectedDates.length === 0 || isPending}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_24px_rgba(74,222,128,0.35)] disabled:cursor-not-allowed disabled:opacity-60 font-raleway"
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  {isPending ? "Sending…" : "Send invitation"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-edge bg-surface px-4 py-2.5 text-xs font-semibold text-body transition-opacity hover:opacity-80 font-raleway"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
