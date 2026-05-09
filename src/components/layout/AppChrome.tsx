"use client";

import { usePathname } from "next/navigation";
import Nav from "@/components/marketing/Nav";

/**
 * Conditionally renders the global marketing-style `<Nav />` for authed app
 * routes. Areas with their own custom chrome (currently `/company/*`) opt out
 * so they can own the entire top surface without a doubled-up nav bar.
 */
export default function AppChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideMarketingNav =
    (pathname?.startsWith("/company") &&
      !pathname?.startsWith("/company/onboarding")) ||
    (pathname?.startsWith("/talent") &&
      !pathname?.startsWith("/talent/onboarding"));

  return (
    <>
      {!hideMarketingNav && <Nav />}
      <main className="flex-1">{children}</main>
    </>
  );
}
