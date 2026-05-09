"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------
// Search approved talent
// ---------------------------------------------------------------------

export interface TalentSearchResult {
  user_id: string;
  full_name: string | null;
  email: string | null;
  headline: string | null;
  skills: string[];
  overall_score: number | null;
  expertise_level: string | null;
}

export async function searchApprovedTalent(
  query: string
): Promise<TalentSearchResult[]> {
  await assertAdmin();
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const admin = createAdminClient();

  // Pull all approved talent — for now we do client-side filtering since
  // the dataset is small. When the pool grows, switch to a pg_trgm index.
  const { data: apps } = await admin
    .from("talent_applications")
    .select("user_id, headline, skills")
    .eq("review_status", "approved")
    .limit(200);

  const talentApps = (apps ?? []) as {
    user_id: string;
    headline: string | null;
    skills: string[];
  }[];

  if (talentApps.length === 0) return [];

  const userIds = talentApps.map((a) => a.user_id);

  const [profilesRes, analysesRes] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds),
    admin
      .from("talent_ai_analyses")
      .select("user_id, overall_score, expertise_level")
      .in("user_id", userIds),
  ]);

  const profileMap = new Map(
    ((profilesRes.data ?? []) as { id: string; full_name: string | null; email: string | null }[])
      .map((p) => [p.id, p])
  );
  const analysisMap = new Map(
    ((analysesRes.data ?? []) as { user_id: string; overall_score: number | null; expertise_level: string | null }[])
      .map((a) => [a.user_id, a])
  );

  // Filter by query
  const results: TalentSearchResult[] = [];
  for (const app of talentApps) {
    const profile = profileMap.get(app.user_id);
    const analysis = analysisMap.get(app.user_id);
    const name = (profile?.full_name ?? "").toLowerCase();
    const email = (profile?.email ?? "").toLowerCase();
    const headline = (app.headline ?? "").toLowerCase();
    const skillsStr = (app.skills ?? []).join(" ").toLowerCase();

    if (
      name.includes(q) ||
      email.includes(q) ||
      headline.includes(q) ||
      skillsStr.includes(q)
    ) {
      results.push({
        user_id: app.user_id,
        full_name: profile?.full_name ?? null,
        email: profile?.email ?? null,
        headline: app.headline,
        skills: app.skills ?? [],
        overall_score: analysis?.overall_score ?? null,
        expertise_level: analysis?.expertise_level ?? null,
      });
    }
    if (results.length >= 20) break;
  }

  return results;
}

// ---------------------------------------------------------------------
// Add recommendation
// ---------------------------------------------------------------------

const AddRecSchema = z.object({
  job_id: z.string().uuid(),
  talent_user_id: z.string().uuid(),
  note: z.string().trim().max(500).optional(),
});

export async function addRecommendation(
  input: z.infer<typeof AddRecSchema>
): Promise<{ ok: boolean; message?: string }> {
  const reviewer = await assertAdmin();
  const parsed = AddRecSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid input." };

  const admin = createAdminClient();

  const { error } = await admin.from("job_recommendations").upsert(
    {
      job_id: parsed.data.job_id,
      talent_user_id: parsed.data.talent_user_id,
      recommended_by: reviewer.id,
      note: parsed.data.note || null,
    },
    { onConflict: "job_id,talent_user_id" }
  );

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin");
  revalidatePath("/company/jobs");
  return { ok: true };
}

// ---------------------------------------------------------------------
// Remove recommendation
// ---------------------------------------------------------------------

export async function removeRecommendation(
  jobId: string,
  talentUserId: string
): Promise<{ ok: boolean; message?: string }> {
  await assertAdmin();

  const admin = createAdminClient();
  const { error } = await admin
    .from("job_recommendations")
    .delete()
    .eq("job_id", jobId)
    .eq("talent_user_id", talentUserId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin");
  revalidatePath("/company/jobs");
  return { ok: true };
}
