import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type FrameAction = {
  href: string;
  label: string;
};

type FrameStat = {
  label: string;
  value: string;
  detail: string;
};

export default function TalentRouteFrame({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions = [],
  stats = [],
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: FrameAction[];
  stats?: FrameStat[];
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-24 sm:px-6 sm:pt-28 lg:px-8">
      <section className="relative overflow-hidden rounded-[28px] border border-edge bg-surface/90 p-6 shadow-[0_28px_80px_-52px_rgba(10,46,26,0.42)] sm:p-8">
        <div className="pointer-events-none absolute -right-12 top-0 h-44 w-44 rounded-full bg-accent/12 blur-3xl" />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
          <div className="relative">
            <p className="text-[11px] uppercase tracking-[0.18em] text-accent font-jetbrains">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-bold text-heading font-raleway sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-body font-raleway sm:text-base">
              {description}
            </p>

            {actions.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {actions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-page-alt px-4 py-2 text-xs font-semibold text-heading transition-all hover:border-accent/30 hover:text-accent hover:shadow-[0_18px_45px_-28px_rgba(74,222,128,0.42)] font-raleway"
                  >
                    {action.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="relative rounded-2xl border border-edge bg-page-alt/80 p-5 backdrop-blur-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/12 text-accent">
              <Icon className="h-6 w-6" />
            </span>
            <p className="mt-4 text-sm font-semibold text-heading font-raleway">
              Clean, fast, mobile-first
            </p>
            <p className="mt-1 text-xs leading-relaxed text-body font-raleway">
              These routes sit inside the same talent shell, so the desktop
              header and mobile bottom tabs stay consistent everywhere.
            </p>
          </div>
        </div>
      </section>

      {stats.length > 0 && (
        <section className="mt-4 grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-edge bg-surface p-4 transition-all duration-300 hover:-translate-y-1 hover:border-accent/25 hover:shadow-[0_20px_50px_-36px_rgba(10,46,26,0.28)]"
            >
              <p className="text-[10px] uppercase tracking-[0.16em] text-subtle font-jetbrains">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-heading font-raleway">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-body font-raleway">{stat.detail}</p>
            </div>
          ))}
        </section>
      )}

      <div className="mt-6">{children}</div>
    </div>
  );
}
