"use client";

import { usePathname } from "next/navigation";
import Nav from "@/components/marketing/Nav";

/**
 * Conditionally renders the global marketing-style `<Nav />` for authed app
 * routes. Company and talent flows either have their own chrome or a focused
 * onboarding surface, so they own the entire top surface.
 */
export default function AppChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideMarketingNav =
    pathname?.startsWith("/company") || pathname?.startsWith("/talent");

  return (
    <>
      {!hideMarketingNav && <Nav />}
      <main className="flex-1">{children}</main>
    </>
  );
}
