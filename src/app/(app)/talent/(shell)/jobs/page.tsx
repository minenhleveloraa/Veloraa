import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  Clock3,
  MapPin,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import TalentRouteFrame from "@/components/talent/TalentRouteFrame";

const JOBS = [
  {
    company: "Northstar Labs",
    title: "Senior Full-stack Engineer",
    location: "Remote - Europe or Africa",
    format: "Fast-moving startup",
    compensation: "$115k - $145k",
    match: "94%",
    summary:
      "Product-heavy role building a modern hiring workflow with Next.js, Supabase, and AI tooling.",
    stack: ["Next.js", "TypeScript", "Postgres"],
  },
  {
    company: "Axiom Cloud",
    title: "Platform Engineer",
    location: "London - Hybrid",
    format: "Infra and systems",
    compensation: "GBP120k - GBP150k",
    match: "91%",
    summary:
      "Own observability, deployment pipelines, and internal developer experience for a high-scale platform team.",
    stack: ["Go", "Kubernetes", "AWS"],
  },
  {
    company: "Meridian AI",
    title: "Applied ML Engineer",
    location: "Berlin - Hybrid",
    format: "Research to product",
    compensation: "EUR110k - EUR140k",
    match: "88%",
    summary:
      "Ship evaluation pipelines and retrieval systems that move LLM experiments into production quickly.",
    stack: ["Python", "PyTorch", "Ray"],
  },
  {
    company: "Sable Commerce",
    title: "Backend Engineer - Payments",
    location: "Remote - Global",
    format: "Scale and reliability",
    compensation: "$130k - $165k",
    match: "86%",
    summary:
      "Work on event-driven payment services, settlement flows, and high-trust customer-facing systems.",
    stack: ["Node.js", "Kafka", "Postgres"],
  },
] as const;

export default function TalentJobsPage() {
  return (
    <TalentRouteFrame
      eyebrow="Talent jobs"
      title="Available jobs matched to your profile"
      description="These are the roles that fit your current signal best. The feed is deliberately curated: tighter fit, stronger teams, fewer dead-end applications."
      icon={Briefcase}
      actions={[
        { href: "/talent/messages", label: "Open messages" },
        { href: "/talent/invites", label: "Review invites" },
      ]}
      stats={[
        { label: "Matched roles", value: "08", detail: "Currently surfaced for you" },
        { label: "Remote-friendly", value: "05", detail: "Open to distributed talent" },
        { label: "Priority roles", value: "03", detail: "Hiring in the next 14 days" },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
        <section className="space-y-4">
          {JOBS.map((job) => (
            <article
              key={`${job.company}-${job.title}`}
              className="rounded-2xl border border-edge bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-[0_26px_70px_-46px_rgba(10,46,26,0.32)]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-heading font-raleway">
                        {job.title}
                      </p>
                      <p className="text-xs text-body font-raleway">{job.company}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.12em] text-subtle font-jetbrains">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-accent" />
                      {job.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5 text-accent" />
                      {job.format}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-body font-raleway">
                    {job.summary}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.stack.map((item) => (
                      <span
                        key={item}
                        className="rounded-lg border border-edge bg-page-alt px-2.5 py-1 text-[11px] text-heading font-jetbrains"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-3 sm:items-end">
                  <div className="rounded-2xl border border-accent/25 bg-accent/8 px-3 py-2 text-right">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-accent font-jetbrains">
                      Match
                    </p>
                    <p className="text-lg font-bold text-heading font-raleway">
                      {job.match}
                    </p>
                    <p className="text-xs text-body font-raleway">{job.compensation}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/talent/messages"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-page-alt px-3 py-2 text-xs font-semibold text-heading transition-all hover:border-accent/30 hover:text-accent font-raleway"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Ask for intro
                    </Link>
                    <Link
                      href="/talent/invites"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition-all hover:opacity-92 hover:shadow-[0_18px_40px_-24px_rgba(74,222,128,0.42)] font-raleway"
                    >
                      Open fit notes
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-edge bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-accent font-jetbrains">
              How ranking works
            </p>
            <ul className="mt-4 space-y-3">
              <li className="flex gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p className="text-sm text-body font-raleway">
                  Roles move up when your recent skills, headline, and response
                  speed line up with what the company is actively hiring for.
                </p>
              </li>
              <li className="flex gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p className="text-sm text-body font-raleway">
                  Remote flexibility and compensation alignment are weighted
                  early so you do not waste time on low-fit openings.
                </p>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-edge bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-subtle font-jetbrains">
              Best next move
            </p>
            <p className="mt-3 text-sm leading-relaxed text-body font-raleway">
              If one of these roles feels right, open your messages and ask the
              Veloraa team for the latest hiring context before you commit.
            </p>
            <Link
              href="/talent/messages"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-opacity hover:opacity-80 font-raleway"
            >
              Go to messages
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        </aside>
      </div>
    </TalentRouteFrame>
  );
}
