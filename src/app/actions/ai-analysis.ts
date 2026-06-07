"use server";

import OpenAI from "openai";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  AnalysisDimensions,
  AnalysisRecommendation,
  ExpertiseLevel,
  SkillScore,
  TalentApplication,
} from "@/lib/types/db";

const RESUME_DOWNLOAD_TIMEOUT_MS = 20_000;
const PDF_PARSE_TIMEOUT_MS = 30_000;
const OPENAI_TIMEOUT_MS = 60_000;
const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------
// Result shape we expect from the model (JSON schema enforced below).
// ---------------------------------------------------------------------

interface AiAnalysisJson {
  overall_score: number;
  expertise_level: ExpertiseLevel;
  summary: string;
  strengths: string[];
  concerns: string[];
  skill_scores: SkillScore[];
  dimensions: AnalysisDimensions;
  recommendation: AnalysisRecommendation;
}

const ANALYSIS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "overall_score",
    "expertise_level",
    "summary",
    "strengths",
    "concerns",
    "skill_scores",
    "dimensions",
    "recommendation",
  ],
  properties: {
    overall_score: {
      type: "integer",
      minimum: 0,
      maximum: 100,
      description: "Overall grade 0-100.",
    },
    expertise_level: {
      type: "string",
      enum: ["Junior", "Mid", "Senior", "Staff", "Principal"],
    },
    summary: {
      type: "string",
      description: "2-3 sentence human summary of the candidate.",
    },
    strengths: {
      type: "array",
      items: { type: "string" },
      description: "3-5 concrete strengths observed.",
    },
    concerns: {
      type: "array",
      items: { type: "string" },
      description: "0-3 honest concerns or gaps.",
    },
    skill_scores: {
      type: "array",
      description: "Top skills with 0-100 scores grounded in the evidence.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["skill", "score", "evidence"],
        properties: {
          skill: { type: "string" },
          score: { type: "integer", minimum: 0, maximum: 100 },
          evidence: { type: "string" },
        },
      },
    },
    dimensions: {
      type: "object",
      additionalProperties: false,
      required: [
        "domain_expertise",
        "leadership",
        "depth",
        "breadth",
        "communication",
      ],
      properties: {
        domain_expertise: { type: "integer", minimum: 0, maximum: 100 },
        leadership: { type: "integer", minimum: 0, maximum: 100 },
        depth: { type: "integer", minimum: 0, maximum: 100 },
        breadth: { type: "integer", minimum: 0, maximum: 100 },
        communication: { type: "integer", minimum: 0, maximum: 100 },
      },
    },
    recommendation: {
      type: "string",
      enum: ["advance", "hold", "decline"],
    },
  },
} as const;

// ---------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------

export async function runAiAnalysis(options?: {
  force?: boolean;
}): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not authenticated." };

  // Short-circuit if we already have a ready analysis and force wasn't asked.
  if (!options?.force) {
    const { data: existing } = await supabase
      .from("talent_ai_analyses")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing?.status === "ready") return { ok: true };
  }

  // Load the application we're grading.
  const { data: app, error: appErr } = await supabase
    .from("talent_applications")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (appErr || !app) {
    return { ok: false, message: "No application on file to analyze." };
  }

  // Mark as pending so clients can poll.
  const { error: pendingErr } = await supabase
    .from("talent_ai_analyses")
    .upsert(
      {
        user_id: user.id,
        status: "pending",
        error: null,
      },
      { onConflict: "user_id" }
    );
  if (pendingErr) {
    return { ok: false, message: pendingErr.message };
  }

  try {
    // --------------------------------------------------------------
    // 1) Pull resume text (PDF → text via pdf-parse).
    // --------------------------------------------------------------
    const resumeText = (await extractResumeText(supabase, app.resume_path)).slice(
      0,
      20000
    );

    // --------------------------------------------------------------
    // 2) Call OpenAI — or fall back to a deterministic demo result
    //    when OPENAI_API_KEY is not configured. This lets us ship the
    //    UI + flow and flip the switch later without any refactoring.
    // --------------------------------------------------------------
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

    let analysis: AiAnalysisJson;
    let usedModel: string;
    let raw: unknown;

    if (!apiKey) {
      analysis = buildDemoAnalysis(app);
      usedModel = "demo-fallback";
      raw = { demo: true };
    } else {
      const openai = new OpenAI({ apiKey });
      const { systemPrompt, userPrompt } = buildPrompt(app, resumeText);

      const resp = await withTimeout(
        openai.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "talent_analysis",
              strict: true,
              schema: ANALYSIS_JSON_SCHEMA,
            },
          },
          temperature: 0.3,
        }),
        OPENAI_TIMEOUT_MS,
        "AI analysis"
      );

      const content = resp.choices[0]?.message?.content ?? "";
      if (!content) throw new Error("Empty response from model.");
      analysis = JSON.parse(content) as AiAnalysisJson;
      usedModel = model;
      raw = resp;
    }

    // --------------------------------------------------------------
    // 3) Persist results + bump the user's onboarding stage.
    // --------------------------------------------------------------
    const { error: upsertErr } = await supabase
      .from("talent_ai_analyses")
      .upsert(
        {
          user_id: user.id,
          status: "ready",
          model: usedModel,
          overall_score: analysis.overall_score,
          expertise_level: analysis.expertise_level,
          summary: analysis.summary,
          strengths: analysis.strengths,
          concerns: analysis.concerns,
          skill_scores: analysis.skill_scores,
          dimensions: analysis.dimensions,
          recommendation: analysis.recommendation,
          raw,
          error: null,
        },
        { onConflict: "user_id" }
      );
    if (upsertErr) throw new Error(upsertErr.message);

    await supabase
      .from("profiles")
      .update({ onboarding_stage: 2 })
      .eq("id", user.id);

    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error during analysis.";
    await supabase
      .from("talent_ai_analyses")
      .upsert(
        { user_id: user.id, status: "failed", error: message },
        { onConflict: "user_id" }
      );
    return { ok: false, message };
  }
}

// ---------------------------------------------------------------------
// Resume extraction
// ---------------------------------------------------------------------

async function extractResumeText(
  supabase: Awaited<ReturnType<typeof createClient>>,
  resumePath: string | null
) {
  if (!resumePath) {
    throw new Error("No resume file is attached to this application.");
  }

  const { data: file, error } = await withTimeout(
    supabase.storage.from("resumes").download(resumePath),
    RESUME_DOWNLOAD_TIMEOUT_MS,
    "Resume download"
  );

  if (error) {
    throw new Error(`Could not download resume: ${error.message}`);
  }
  if (!file) {
    throw new Error("Could not download resume: file was empty.");
  }

  const lower = resumePath.toLowerCase();
  if (!lower.endsWith(".pdf")) {
    return "[Non-PDF resume uploaded - text extraction skipped.]";
  }

  const buf = Buffer.from(
    await withTimeout(
      file.arrayBuffer(),
      RESUME_DOWNLOAD_TIMEOUT_MS,
      "Resume file read"
    )
  );

  try {
    const { PDFParse } = await import("pdf-parse");
    PDFParse.setWorker(
      pathToFileURL(
        require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs")
      ).href
    );
    const parser = new PDFParse({ data: buf });

    try {
      const parsed = await withTimeout(
        parser.getText(),
        PDF_PARSE_TIMEOUT_MS,
        "Resume PDF parsing"
      );

      const text = parsed.text?.trim() ?? "";
      if (!text) {
        return "[PDF parsed successfully, but no selectable text was found.]";
      }

      return text;
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    throw new Error(`Could not parse resume PDF: ${message}`);
  }
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)}s.`)
      );
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

// ---------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------

function buildPrompt(app: TalentApplication, resumeText: string) {
  const systemPrompt = [
    "You are a senior technical recruiter and engineering manager at an elite",
    "talent marketplace. You grade engineers fairly and rigorously based only",
    "on evidence the candidate has provided.",
    "",
    "Scoring rules:",
    "- Be calibrated: a typical engineer scores 55-70. Scores above 85 require",
    "  concrete evidence of senior-level impact; scores above 92 require",
    "  exceptional, industry-visible work.",
    "- 'expertise_level' should reflect scope of ownership, not just tenure.",
    "- 'skill_scores' should list 5-10 most important skills from their stack,",
    "  each with a one-line 'evidence' quote paraphrased from the resume.",
    "- 'dimensions' captures breadth/depth/leadership/domain/communication 0-100.",
    "- 'recommendation' = 'advance' if overall_score >= 70 AND no dealbreakers,",
    "  'hold' if marginal, 'decline' if clearly below bar.",
    "- Be honest about gaps in 'concerns' — but keep tone professional and kind.",
  ].join("\n");

  const roles = (app.work_experience ?? [])
    .map(
      (w, i) =>
        `  ${i + 1}. ${w.title ?? ""} @ ${w.company ?? ""} ` +
        `(${w.start ?? "?"}–${w.current ? "present" : w.end ?? "?"})` +
        (w.description ? `\n     ${w.description}` : "")
    )
    .join("\n");

  const userPrompt = [
    "# Candidate application",
    "",
    `- Headline: ${app.headline ?? "(not provided)"}`,
    `- Location: ${app.location ?? "(not provided)"}`,
    `- Years of experience: ${app.years_experience ?? "(not provided)"}`,
    `- LinkedIn: ${app.linkedin_url ?? "—"}`,
    `- GitHub: ${app.github_url ?? "—"}`,
    `- Portfolio: ${app.portfolio_url ?? "—"}`,
    "",
    "## Self-summary",
    app.bio ?? "(no bio provided)",
    "",
    "## Declared skills",
    (app.skills ?? []).join(", ") || "(none)",
    "",
    "## Work experience",
    roles || "(none provided)",
    "",
    "## Resume text",
    resumeText || "(no resume text available)",
    "",
    "Grade this candidate per the scoring rules. Return ONLY the JSON object.",
  ].join("\n");

  return { systemPrompt, userPrompt };
}

// ---------------------------------------------------------------------
// Deterministic demo analysis (used when OPENAI_API_KEY is not set).
// This lets you click through the flow end-to-end today.
// ---------------------------------------------------------------------

function buildDemoAnalysis(app: TalentApplication): AiAnalysisJson {
  const years = app.years_experience ?? 3;
  const skills = app.skills ?? [];
  const baseScore = Math.min(95, 50 + years * 3 + skills.length * 2);

  const level: ExpertiseLevel =
    years >= 12
      ? "Principal"
      : years >= 8
      ? "Staff"
      : years >= 5
      ? "Senior"
      : years >= 2
      ? "Mid"
      : "Junior";

  const skill_scores: SkillScore[] = skills.slice(0, 8).map((s, i) => ({
    skill: s,
    score: Math.max(45, Math.min(94, baseScore - i * 3 + (i % 2 === 0 ? 5 : -2))),
    evidence: "Listed in application and referenced across multiple roles.",
  }));

  return {
    overall_score: baseScore,
    expertise_level: level,
    summary: `${level}-level engineer with ${years}+ years of experience. Demo analysis — set OPENAI_API_KEY to get real grading.`,
    strengths: [
      "Clear, structured self-presentation.",
      `Breadth across ${skills.length} declared skills.`,
      (app.work_experience ?? []).length > 1
        ? "Multiple roles showing career progression."
        : "Focused, specialist background.",
    ],
    concerns:
      skills.length < 5
        ? ["Declared skill set is narrow — consider expanding."]
        : [],
    skill_scores,
    dimensions: {
      domain_expertise: Math.min(95, baseScore + 4),
      leadership:
        level === "Staff" || level === "Principal"
          ? Math.min(92, baseScore + 2)
          : Math.max(40, baseScore - 12),
      depth: Math.min(94, baseScore + 3),
      breadth: Math.min(90, 55 + skills.length * 3),
      communication: Math.min(88, 60 + (app.bio?.length ?? 0) / 40),
    },
    recommendation: baseScore >= 70 ? "advance" : baseScore >= 55 ? "hold" : "decline",
  };
}
