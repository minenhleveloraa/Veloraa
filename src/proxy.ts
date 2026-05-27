import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Edge-runtime friendly admin check — reads the env var directly. The
// server-side `isAdminEmail` helper uses "server-only" and isn't safe to
// import here.
function isAllowlistedAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS ?? "";
  const allowed = new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
  return allowed.has(email.trim().toLowerCase());
}

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);

  // ─── Geo-based currency + country detection ───
  // Vercel injects x-vercel-ip-country header automatically. We persist
  // both `v_currency` (UI display) and `v_country` (provider routing in
  // checkout APIs). Both are technically necessary for the billing UX,
  // sameSite=lax, no PII.
  if (!request.cookies.has("v_currency") || !request.cookies.has("v_country")) {
    const country = (request.headers.get("x-vercel-ip-country") ?? "").toUpperCase();
    const currency = country === "ZA" ? "ZAR" : "USD";

    const opts = {
      path: "/",
      maxAge: 60 * 60 * 24 * 90, // 90 days
      sameSite: "lax" as const,
    };

    response.cookies.set("v_currency", currency, opts);
    response.cookies.set("v_country", country || "US", opts);
  }

  // Early-gate /admin/* — the layout enforces this too, but stopping
  // non-admins at the edge avoids leaking any page-chrome markup.
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("next", "/admin");
      return NextResponse.redirect(url);
    }
    if (!isAllowlistedAdmin(user.email)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.delete("next");
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image, favicon, other static assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
