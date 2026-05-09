"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  searchApprovedTalent,
  addRecommendation,
  removeRecommendation,
} from "@/app/actions/admin-recommendations";
import type { TalentSearchResult } from "@/app/actions/admin-recommendations";

interface ExistingRec {
  talent_user_id: string;
  full_name: string | null;
  headline: string | null;
  overall_score: number | null;
  skills: string[];
}

export default function TalentRecommender({
  jobId,
  existingRecs,
}: {
  jobId: string;
  existingRecs: ExistingRec[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TalentSearchResult[]>([]);
  const [recs, setRecs] = useState<ExistingRec[]>(existingRecs);
  const [searching, startSearch] = useTransition();
  const [acting, startAction] = useTransition();

  const recIds = new Set(recs.map((r) => r.talent_user_id));

  function handleSearch() {
    if (query.trim().length < 2) return;
    startSearch(async () => {
      const res = await searchApprovedTalent(query.trim());
      setResults(res);
    });
  }

  function handleAdd(talent: TalentSearchResult) {
    startAction(async () => {
      const res = await addRecommendation({
        job_id: jobId,
        talent_user_id: talent.user_id,
      });
      if (res.ok) {
        setRecs((prev) => [
          ...prev,
          {
            talent_user_id: talent.user_id,
            full_name: talent.full_name,
            headline: talent.headline,
            overall_score: talent.overall_score,
            skills: talent.skills,
          },
        ]);
      }
    });
  }

  function handleRemove(talentUserId: string) {
    startAction(async () => {
      const res = await removeRecommendation(jobId, talentUserId);
      if (res.ok) {
        setRecs((prev) => prev.filter((r) => r.talent_user_id !== talentUserId));
      }
    });
  }

  return (
    <section className="rounded-2xl border border-edge bg-surface p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-heading font-raleway">
          Recommend talent for this role
        </h3>
      </div>

      {/* Current recommendations */}
      {recs.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
            Recommended ({recs.length})
          </p>
          {recs.map((r) => (
            <div
              key={r.talent_user_id}
              className="flex items-center gap-3 rounded-xl border border-accent/20 bg-accent/5 p-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold font-jetbrains">
                {initials(r.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-heading font-raleway">
                  {r.full_name ?? "Unknown"}
                </p>
                <p className="truncate text-xs text-body font-raleway">
                  {r.headline ?? "—"}
                </p>
              </div>
              {r.overall_score != null && (
                <span className="text-xs font-bold text-accent font-jetbrains">
                  {r.overall_score}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(r.talent_user_id)}
                disabled={acting}
                className="rounded-lg p-1.5 text-subtle transition-colors hover:bg-red-500/10 hover:text-red-500"
                aria-label="Remove recommendation"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.08em] text-subtle font-jetbrains mb-2">
          Search approved talent
        </p>
        <div className="flex gap-2">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Name, skills, headline…"
              className="w-full rounded-lg border border-edge bg-page-alt py-2 pl-10 pr-4 text-sm text-heading placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 font-raleway"
            />
          </label>
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || query.trim().length < 2}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 font-raleway"
          >
            {searching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {results.map((t) => {
            const alreadyAdded = recIds.has(t.user_id);
            return (
              <div
                key={t.user_id}
                className="flex items-center gap-3 rounded-xl border border-edge bg-page-alt p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pill-bg text-accent text-xs font-bold font-jetbrains">
                  {initials(t.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-heading font-raleway">
                    {t.full_name ?? t.email ?? "Unknown"}
                  </p>
                  <p className="truncate text-xs text-body font-raleway">
                    {t.headline ?? "—"}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {t.skills.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-body font-jetbrains"
                      >
                        {s}
                      </span>
                    ))}
                    {t.skills.length > 4 && (
                      <span className="text-[10px] text-subtle font-jetbrains">
                        +{t.skills.length - 4}
                      </span>
                    )}
                  </div>
                </div>
                {t.overall_score != null && (
                  <div className="text-right">
                    <p className="text-xs font-bold text-heading font-jetbrains">
                      {t.overall_score}
                    </p>
                    <p className="text-[10px] text-subtle font-jetbrains">
                      {t.expertise_level ?? "—"}
                    </p>
                  </div>
                )}
                {alreadyAdded ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-accent/10 px-3 py-1.5 text-[11px] font-semibold text-accent font-raleway">
                    <CheckCircle2 className="h-3 w-3" />
                    Added
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAdd(t)}
                    disabled={acting}
                    className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 font-raleway"
                  >
                    <UserPlus className="h-3 w-3" />
                    Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {results.length === 0 && query.length >= 2 && !searching && (
        <p className="text-xs text-subtle text-center py-4 font-raleway">
          No approved talent found for &ldquo;{query}&rdquo;
        </p>
      )}
    </section>
  );
}

function initials(name: string | null): string {
  const src = (name ?? "?").trim();
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}
