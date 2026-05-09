"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Uploads a file directly to a Supabase Storage bucket with a real fetch
 * timeout and user-friendly errors.
 *
 * We bypass `supabase.storage.from().upload()` because the supabase-js wrapper
 * does not accept an `AbortSignal`, so a `Promise.race` "timeout" cannot
 * actually cancel the underlying request and can appear to hang forever.
 * This helper issues the request ourselves and aborts on timeout.
 */
export async function uploadToBucket(options: {
  bucket: string;
  path: string;
  file: File;
  upsert?: boolean;
  timeoutMs?: number;
}): Promise<void> {
  const { bucket, path, file, upsert = false, timeoutMs = 60_000 } = options;
  const supabase = createClient();

  // Make sure we have a valid session — uploading to a private bucket fails
  // silently (or hangs retrying token refreshes in some versions) if the user
  // token isn't ready yet.
  const {
    data: { session },
    error: sessionErr,
  } = await supabase.auth.getSession();
  if (sessionErr) {
    throw new Error(`Couldn't read auth session: ${sessionErr.message}`);
  }
  if (!session) {
    throw new Error(
      "You're signed out. Please sign in again and retry the upload."
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    throw new Error(
      "Supabase URL isn't configured. Set NEXT_PUBLIC_SUPABASE_URL."
    );
  }

  const endpoint = `${baseUrl.replace(/\/$/, "")}/storage/v1/object/${encodeURIComponent(
    bucket
  )}/${path.split("/").map(encodeURIComponent).join("/")}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${session.access_token}`,
        "content-type": file.type || "application/octet-stream",
        "cache-control": "3600",
        "x-upsert": upsert ? "true" : "false",
      },
      body: file,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error(
        `Upload timed out after ${Math.round(
          timeoutMs / 1000
        )}s. Check your connection and try again.`
      );
    }
    throw e instanceof Error ? e : new Error("Network error during upload.");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    // Supabase returns JSON like { statusCode, error, message } on failure.
    let detail = "";
    try {
      const body = (await res.json()) as {
        message?: string;
        error?: string;
        statusCode?: string;
      };
      detail = body.message || body.error || "";
      if (res.status === 404 && /bucket/i.test(detail)) {
        detail = `Storage bucket "${bucket}" doesn't exist. Run the Supabase migration (supabase/schema.sql) to create it.`;
      }
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(
      detail || `Upload failed with HTTP ${res.status}. Please try again.`
    );
  }
}
