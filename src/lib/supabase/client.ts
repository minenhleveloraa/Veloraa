"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Module-level singleton. Every call to `createClient()` returns the same
// instance for the lifetime of the browser tab.
//
// Each `createBrowserClient` instance owns its own auth state machine and
// reads cookies independently. Spinning up multiple instances on the same
// page (e.g. one in a component plus one in a helper like uploadToBucket)
// makes them race on the initial cookie read / token refresh — which is
// what caused the company-onboarding logo upload to hang on the first
// attempt and only work after a page refresh.
let browserClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return browserClient;
}
