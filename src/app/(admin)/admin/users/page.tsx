import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  Mail,
  Search as SearchIcon,
  UserRound,
  XCircle,
} from "lucide-react";
import { getCurrentAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import MessageUserButton from "@/components/admin/MessageUserButton";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type Role = "talent" | "company";
type FilterRole = Role | "all";

interface DirectoryRow {
  user_id: string;
  role: Role;
  name: string;
  subtitle: string | null;
  email: string | null;
  status: "pending" | "approved" | "rejected" | "unsubmitted";
  detail_href: string;
}

function parseRole(raw: string | string[] | undefined): FilterRole {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "talent" || v === "company") return v;
  return "all";
}

function parseQ(raw: string | string[] | undefined): string {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return (v ?? "").trim().toLowerCase();
}

export default async function AdminUsersDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[]; q?: string | string[] }>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/");

  const { role: roleRaw, q: qRaw } = await searchParams;
  const role = parseRole(roleRaw);
  const q = parseQ(qRaw);

  const rows = await fetchUsers(role);
  const filtered = q
    ? rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.subtitle ?? "").toLowerCase().includes(q) ||
          (r.email ?? "").toLowerCase().includes(q)
      )
    : rows;

  const counts = {
    talent: rows.filter((r) => r.role === "talent").length,
    company: rows.filter((r) => r.role === "company").length,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <span className="mb-2 inline-block text-[11px] uppercase tracking-[0.08em] text-accent font-jetbrains">
          Admin · Users
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl font-raleway">
          Everyone on Veloraa
        </h1>
        <p className="mt-2 text-sm text-body font-raleway">
          Every talent and company with an account. Open any profile to review
          or start a direct message.
        </p>
      </div>

      {/* Role tabs */}
      <div className="mb-6 inline-flex rounded-2xl border border-edge bg-surface p-1">
        <RoleTab
          active={role === "all"}
          href={q ? `/admin/users?q=${encodeURIComponent(q)}` : "/admin/users"}
          icon={<UserRound className="h-3.5 w-3.5" />}
          label="All"
          count={rows.length}
        />
        <RoleTab
          active={role === "talent"}
          href={`/admin/users?role=talent${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          icon={<UserRound className="h-3.5 w-3.5" />}
          label="Talent"
          count={counts.talent}
        />
        <RoleTab
          active={role === "company"}
          href={`/admin/users?role=company${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          icon={<Building2 className="h-3.5 w-3.5" />}
          label="Companies"
          count={counts.company}
        />
      </div>

      {/* Search */}
      <form method="get" className="mb-6 flex items-center gap-2">
        {role !== "all" && <input type="hidden" name="role" value={role} />}
        <label className="relative block max-w-md flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by name, headline, or email…"
            className="w-full rounded-full border border-edge bg-surface py-2 pl-9 pr-3 text-sm text-heading placeholder:text-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 font-raleway"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-btn-bg px-4 py-2 text-xs font-semibold text-btn-fg transition-opacity hover:opacity-90 font-raleway"
        >
          Search
        </button>
      </form>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-edge bg-surface p-16 text-center">
          <p className="text-lg font-semibold text-heading font-raleway">
            {q ? "No matches" : "No users yet"}
          </p>
          <p className="mt-1 text-sm text-body font-raleway">
            {q
              ? "Try a different search term."
              : "Approved talent and companies will show up here."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-edge bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-edge bg-page-alt text-[11px] uppercase tracking-[0.08em] text-subtle font-jetbrains">
              <tr>
                <th className="px-5 py-3 font-medium">User</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">
                  Role
                </th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">
                  Email
                </th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.user_id}
                  className="border-b border-edge last:border-b-0 hover:bg-page-alt"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pill-bg text-accent text-xs font-bold font-jetbrains">
                        {initials(r.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-heading font-raleway">
                          {r.name}
                        </p>
                        {r.subtitle && (
                          <p className="truncate text-xs text-subtle font-raleway">
                            {r.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-5 py-4 md:table-cell">
                    <RoleBadge role={r.role} />
                  </td>
                  <td className="hidden px-5 py-4 text-xs text-body lg:table-cell font-jetbrains">
                    {r.email ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-3 w-3" />
                        {r.email}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <MessageUserButton userId={r.user_id} variant="pill" />
                      <Link
                        href={r.detail_href}
                        className="inline-flex items-center gap-1 rounded-lg border border-edge bg-surface px-3 py-1.5 text-xs font-semibold text-heading transition-colors hover:border-accent/40 hover:text-accent font-raleway"
                      >
                        Profile
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchUsers(role: FilterRole): Promise<DirectoryRow[]> {
  const admin = createAdminClient();

  const [profilesRes, talentRes, companyRes] = await Promise.all([
    admin
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    admin
      .from("talent_applications")
      .select("user_id, headline, location, review_status, stage_1_submitted_at"),
    admin
      .from("company_applications")
      .select("user_id, legal_name, hq_country, review_status, stage_1_submitted_at"),
  ]);

  const profiles =
    (profilesRes.data as {
      id: string;
      email: string | null;
      full_name: string | null;
      role: Role | null;
      created_at: string;
    }[]) ?? [];

  const talentByUser = new Map<
    string,
    {
      user_id: string;
      headline: string | null;
      location: string | null;
      review_status: "pending" | "approved" | "rejected";
      stage_1_submitted_at: string | null;
    }
  >();
  for (const t of (talentRes.data as
    | {
        user_id: string;
        headline: string | null;
        location: string | null;
        review_status: "pending" | "approved" | "rejected";
        stage_1_submitted_at: string | null;
      }[]
    | null) ?? []) {
    talentByUser.set(t.user_id, t);
  }

  const companyByUser = new Map<
    string,
    {
      user_id: string;
      legal_name: string | null;
      hq_country: string | null;
      review_status: "pending" | "approved" | "rejected";
      stage_1_submitted_at: string | null;
    }
  >();
  for (const c of (companyRes.data as
    | {
        user_id: string;
        legal_name: string | null;
        hq_country: string | null;
        review_status: "pending" | "approved" | "rejected";
        stage_1_submitted_at: string | null;
      }[]
    | null) ?? []) {
    companyByUser.set(c.user_id, c);
  }

  const rows: DirectoryRow[] = [];
  for (const p of profiles) {
    if (!p.role) continue;
    if (role !== "all" && role !== p.role) continue;

    if (p.role === "talent") {
      const t = talentByUser.get(p.id);
      rows.push({
        user_id: p.id,
        role: "talent",
        name: p.full_name?.trim() || p.email || "Unnamed talent",
        subtitle: t?.headline?.trim() || t?.location?.trim() || null,
        email: p.email,
        status: t?.stage_1_submitted_at
          ? t.review_status ?? "pending"
          : "unsubmitted",
        detail_href: `/admin/talent/${p.id}`,
      });
    } else {
      const c = companyByUser.get(p.id);
      rows.push({
        user_id: p.id,
        role: "company",
        name: c?.legal_name?.trim() || p.full_name?.trim() || p.email || "Unnamed company",
        subtitle: c?.hq_country ?? null,
        email: p.email,
        status: c?.stage_1_submitted_at
          ? c.review_status ?? "pending"
          : "unsubmitted",
        detail_href: `/admin/company/${p.id}`,
      });
    }
  }

  return rows;
}

// ---------------------------------------------------------------------------
// UI bits
// ---------------------------------------------------------------------------

function RoleTab({
  active,
  href,
  icon,
  label,
  count,
}: {
  active: boolean;
  href: string;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all font-raleway ${
        active
          ? "bg-accent text-white shadow-[0_4px_14px_rgba(74,222,128,0.25)]"
          : "text-body hover:text-heading"
      }`}
    >
      {icon}
      {label}
      <span
        className={`ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold font-jetbrains ${
          active ? "bg-white text-accent" : "bg-pill-bg text-body"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const cfg =
    role === "talent"
      ? {
          label: "Talent",
          className: "bg-pill-bg text-accent border-accent/30",
          icon: <UserRound className="h-3 w-3" />,
        }
      : {
          label: "Company",
          className: "bg-pill-bg text-accent border-accent/30",
          icon: <Building2 className="h-3 w-3" />,
        };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] font-jetbrains ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function StatusPill({
  status,
}: {
  status: DirectoryRow["status"];
}) {
  const cfg = {
    pending: {
      label: "Awaiting review",
      className: "bg-amber-500/10 text-amber-600 border-amber-500/30",
      icon: <Clock className="h-3 w-3" />,
    },
    approved: {
      label: "Approved",
      className: "bg-accent/10 text-accent border-accent/30",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    rejected: {
      label: "Rejected",
      className: "bg-red-500/10 text-red-500 border-red-500/30",
      icon: <XCircle className="h-3 w-3" />,
    },
    unsubmitted: {
      label: "Onboarding",
      className: "bg-pill-bg text-body border-edge",
      icon: <Clock className="h-3 w-3" />,
    },
  }[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] font-jetbrains ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function initials(full: string): string {
  const src = (full ?? "?").trim();
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}
