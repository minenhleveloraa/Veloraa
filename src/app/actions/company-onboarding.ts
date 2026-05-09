"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { companyWelcomeEmail } from "@/lib/email/templates";
import {
  COMPANY_SIZES,
  COMPANY_STAGES,
  ENG_CULTURES,
  HIRING_METHODS,
  HIRING_REGIONS,
  HIRING_URGENCIES,
  HIRING_VOLUMES,
  INDUSTRIES,
  ALL_ROLES,
  PLANS,
  SALARY_RANGES,
  WORK_STYLES,
} from "@/lib/company/options";

export type CompanyOnboardingState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

// ---------------------------------------------------------------------
// Helpers: build Zod enums from the shared option catalogs
// ---------------------------------------------------------------------

const sizeIds = COMPANY_SIZES.map((o) => o.id) as [string, ...string[]];
const stageIds = COMPANY_STAGES.map((o) => o.id) as [string, ...string[]];
const workStyleIds = WORK_STYLES.map((o) => o.id) as [string, ...string[]];
const cultureIds = ENG_CULTURES.map((o) => o.id) as [string, ...string[]];
const urgencyIds = HIRING_URGENCIES.map((o) => o.id) as [string, ...string[]];
const volumeIds = HIRING_VOLUMES.map((o) => o.id) as [string, ...string[]];
const salaryIds = SALARY_RANGES.map((o) => o.id) as [string, ...string[]];
const methodIds = HIRING_METHODS.map((o) => o.id) as [string, ...string[]];
const planIds = PLANS.map((p) => p.id) as [string, ...string[]];

const INDUSTRY_SET = new Set<string>(INDUSTRIES);
const ROLE_SET = new Set<string>(ALL_ROLES);
const REGION_SET = new Set<string>(HIRING_REGIONS);

// ---------------------------------------------------------------------
// Final submission schema — every required field enforced
// ---------------------------------------------------------------------

const urlRequired = z
  .string()
  .trim()
  .min(1, "Website is required.")
  .regex(/^https?:\/\/.+/i, "Must start with http:// or https://");

const SubmitSchema = z.object({
  // Step 2
  legal_name: z
    .string()
    .trim()
    .min(2, "Tell us your company's legal name.")
    .max(120, "That's a bit long."),
  website_url: urlRequired,
  company_size: z.enum(sizeIds),
  hq_country: z.string().trim().min(2, "Pick a country."),
  company_stage: z.enum(stageIds),

  // Step 3
  industries: z
    .array(z.string())
    .min(1, "Pick at least one industry.")
    .max(3, "Pick up to 3 industries.")
    .refine((arr) => arr.every((v) => INDUSTRY_SET.has(v)), {
      error: "Unknown industry selected.",
    }),
  roles_hiring: z
    .array(z.string())
    .min(1, "Pick at least one role.")
    .refine((arr) => arr.every((v) => ROLE_SET.has(v)), {
      error: "Unknown role selected.",
    }),

  // Step 4 — optional (skippable step). If present, must validate.
  work_style: z.enum(workStyleIds).nullable().optional(),
  hiring_regions: z
    .array(z.string())
    .default([])
    .refine((arr) => arr.every((v) => REGION_SET.has(v)), {
      error: "Unknown region selected.",
    }),
  eng_culture: z.enum(cultureIds).nullable().optional(),

  // Step 5 — required
  hiring_urgency: z.enum(urgencyIds),
  hiring_volume: z.enum(volumeIds),
  salary_range: z.enum(salaryIds),
  hiring_method: z.enum(methodIds),

  // Step 6 — required
  selected_plan: z.enum(planIds),
});

// ---------------------------------------------------------------------
// Draft schema — everything optional, just lightly typed
// ---------------------------------------------------------------------

export interface CompanyDraftInput {
  legal_name?: string | null;
  website_url?: string | null;
  logo_path?: string | null;
  logo_filename?: string | null;
  company_size?: string | null;
  hq_country?: string | null;
  company_stage?: string | null;

  industries?: string[];
  roles_hiring?: string[];

  work_style?: string | null;
  hiring_regions?: string[];
  eng_culture?: string | null;

  hiring_urgency?: string | null;
  hiring_volume?: string | null;
  salary_range?: string | null;
  hiring_method?: string | null;

  selected_plan?: string | null;

  draft_step?: number;
}

export async function saveCompanyDraft(
  data: CompanyDraftInput
): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not authenticated." };

  const { error } = await supabase
    .from("company_applications")
    .upsert({ user_id: user.id, ...data }, { onConflict: "user_id" });

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

// ---------------------------------------------------------------------
// Submit — marks onboarding complete, sends welcome email, routes to
// the dashboard (which shows the "awaiting review" state).
// ---------------------------------------------------------------------

async function getOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function submitCompanyOnboarding(
  _prev: CompanyOnboardingState | undefined,
  formData: FormData
): Promise<CompanyOnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not authenticated." };

  // Pull array fields out of hidden JSON payloads.
  let industries: string[] = [];
  let roles_hiring: string[] = [];
  let hiring_regions: string[] = [];
  try {
    industries = JSON.parse(String(formData.get("industries") ?? "[]"));
    roles_hiring = JSON.parse(String(formData.get("roles_hiring") ?? "[]"));
    hiring_regions = JSON.parse(
      String(formData.get("hiring_regions") ?? "[]")
    );
  } catch {
    return { ok: false, message: "Invalid form payload." };
  }

  const pickStr = (k: string) => {
    const v = formData.get(k);
    if (v === null || v === "") return null;
    return String(v);
  };

  const parsed = SubmitSchema.safeParse({
    legal_name: formData.get("legal_name"),
    website_url: formData.get("website_url"),
    company_size: pickStr("company_size"),
    hq_country: formData.get("hq_country"),
    company_stage: pickStr("company_stage"),
    industries,
    roles_hiring,
    work_style: pickStr("work_style"),
    hiring_regions,
    eng_culture: pickStr("eng_culture"),
    hiring_urgency: pickStr("hiring_urgency"),
    hiring_volume: pickStr("hiring_volume"),
    salary_range: pickStr("salary_range"),
    hiring_method: pickStr("hiring_method"),
    selected_plan: pickStr("selected_plan"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[] | undefined
      >,
      message: "Please fix the highlighted fields.",
    };
  }

  const logo_path = pickStr("logo_path");
  const logo_filename = pickStr("logo_filename");

  const { error: upsertErr } = await supabase
    .from("company_applications")
    .upsert(
      {
        user_id: user.id,
        legal_name: parsed.data.legal_name,
        website_url: parsed.data.website_url,
        logo_path,
        logo_filename,
        company_size: parsed.data.company_size,
        hq_country: parsed.data.hq_country,
        company_stage: parsed.data.company_stage,
        industries: parsed.data.industries,
        roles_hiring: parsed.data.roles_hiring,
        work_style: parsed.data.work_style ?? null,
        hiring_regions: parsed.data.hiring_regions,
        eng_culture: parsed.data.eng_culture ?? null,
        hiring_urgency: parsed.data.hiring_urgency,
        hiring_volume: parsed.data.hiring_volume,
        salary_range: parsed.data.salary_range,
        hiring_method: parsed.data.hiring_method,
        selected_plan: parsed.data.selected_plan,
        draft_step: 5,
        stage_1_submitted_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (upsertErr) return { ok: false, message: upsertErr.message };

  const { error: profileErr } = await supabase
    .from("profiles")
    .update({ onboarding_stage: 1 })
    .eq("id", user.id);
  if (profileErr) return { ok: false, message: profileErr.message };

  // Welcome email — best effort.
  if (user.email) {
    const origin = await getOrigin();
    const tmpl = companyWelcomeEmail({
      companyName: parsed.data.legal_name,
      dashboardHref: `${origin}/company/dashboard`,
    });
    await sendEmail({ to: user.email, ...tmpl });
  }

  revalidatePath("/", "layout");
  redirect("/company/dashboard");
}
