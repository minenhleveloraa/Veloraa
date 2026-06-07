export type UserRole = "talent" | "company";

export interface Profile {
  id: string;
  role: UserRole | null;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  onboarding_stage: number;
  created_at: string;
  updated_at: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  start: string; // YYYY-MM
  end: string | null; // null = current
  current: boolean;
  description: string;
}

export type ReviewStatus = "pending" | "approved" | "rejected" | "pending_update" | "hidden";

/**
 * Per-stage status for the post-approval vetting funnel (technical
 * assessment and senior-engineer interview). Driven manually by admins.
 */
export type AssessmentStatus = "pending" | "passed" | "failed";

export interface VelscreenReportPayload {
  scores: {
    technical_depth: number;
    problem_solving: number;
    communication: number;
    ownership: number;
    self_awareness: number;
    overall: number;
  };
  summary: string;
  strengths: string[];
  concerns: string[];
  recommendation: "advance" | "hold" | "decline";
  transcript: { role: string; content: string }[];
  model: string;
  completed_at: string;
}

export interface TalentApplication {
  user_id: string;
  avatar_url: string | null;
  headline: string | null;
  location: string | null;
  years_experience: number | null;
  bio: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  skills: string[];
  work_experience: WorkExperience[];
  resume_path: string | null;
  resume_filename: string | null;
  previous_approved_state: Record<string, unknown> | null;
  stage_1_submitted_at: string | null;
  review_status: ReviewStatus;
  review_reason: string | null;
  review_decision_at: string | null;
  reviewed_by: string | null;
  reapply_after: string | null;
  technical_status: AssessmentStatus;
  technical_reason: string | null;
  technical_decision_at: string | null;
  interview_status: AssessmentStatus;
  interview_reason: string | null;
  interview_decision_at: string | null;
  velscreen_session_token: string | null;
  velscreen_interview_url: string | null;
  velscreen_report: VelscreenReportPayload | null;
  velscreen_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------
// AI analysis (stage 2)
// ---------------------------------------------------------------------

export type ExpertiseLevel =
  | "Junior"
  | "Mid"
  | "Senior"
  | "Staff"
  | "Principal";

export type AnalysisRecommendation = "advance" | "hold" | "decline";

export type AnalysisStatus = "pending" | "ready" | "failed";

export interface SkillScore {
  skill: string;
  score: number; // 0-100
  evidence?: string;
}

export interface AnalysisDimensions {
  domain_expertise: number;
  leadership: number;
  depth: number;
  breadth: number;
  communication: number;
}

// ---------------------------------------------------------------------
// Company onboarding
// ---------------------------------------------------------------------

export interface CompanyApplication {
  user_id: string;

  legal_name: string | null;
  website_url: string | null;
  logo_path: string | null;
  logo_filename: string | null;
  company_size: string | null;
  hq_country: string | null;
  company_stage: string | null;

  industries: string[];
  roles_hiring: string[];

  work_style: string | null;
  hiring_regions: string[];
  eng_culture: string | null;

  hiring_urgency: string | null;
  hiring_volume: string | null;
  salary_range: string | null;
  hiring_method: string | null;

  selected_plan: string | null;

  draft_step: number;
  stage_1_submitted_at: string | null;

  review_status: ReviewStatus;
  review_reason: string | null;
  review_decision_at: string | null;
  reviewed_by: string | null;
  reapply_after: string | null;

  card_collected: boolean;

  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------
// Job postings
// ---------------------------------------------------------------------

export type JobStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "published";

export interface CompanyJob {
  id: string;
  company_id: string;

  title: string;
  role_category: string;
  seniority: string;
  employment_type: string;
  work_arrangement: string;
  location: string | null;
  salary_range: string | null;
  description: string;
  skills: string[];
  benefits: string | null;

  status: JobStatus;
  review_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;

  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------
// Job recommendations (admin → talent)
// ---------------------------------------------------------------------

export interface JobRecommendation {
  id: string;
  job_id: string;
  talent_user_id: string;
  recommended_by: string | null;
  note: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------
// Interview invitations (company → talent)
// ---------------------------------------------------------------------

export type InvitationStatus = "pending" | "accepted" | "declined";

export interface InterviewInvitation {
  id: string;
  job_id: string;
  company_user_id: string;
  talent_user_id: string;
  proposed_dates: string[];
  accepted_date: string | null;
  message: string | null;
  status: InvitationStatus;
  decline_reason: string | null;
  thread_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TalentAiAnalysis {
  user_id: string;
  model: string | null;
  overall_score: number | null;
  expertise_level: ExpertiseLevel | null;
  summary: string | null;
  strengths: string[];
  concerns: string[];
  skill_scores: SkillScore[];
  dimensions: Partial<AnalysisDimensions> | null;
  recommendation: AnalysisRecommendation | null;
  raw: unknown;
  status: AnalysisStatus;
  error: string | null;
  created_at: string;
  updated_at: string;
}
