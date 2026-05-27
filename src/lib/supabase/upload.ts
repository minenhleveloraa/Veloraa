"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Uploads a file directly to a Supabase Storage bucket with a real end-to-end
 * timeout and user-friendly errors.
 *
 * We bypass `supabase.storage.from().upload()` because the supabase-js wrapper
 * does not expose an AbortSignal for storage uploads. This helper issues the
 * request ourselves, includes the same auth headers Supabase normally sends,
 * and aborts if either auth lookup or the network upload stalls.
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
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const timeoutMessage = `Upload timed out after ${Math.round(
    timeoutMs / 1000
  )}s. Check your connection and try again.`;

  const withUploadTimeout = async <T>(promise: Promise<T>): Promise<T> => {
    if (controller.signal.aborted) throw new Error(timeoutMessage);

    return new Promise<T>((resolve, reject) => {
      const onAbort = () => reject(new Error(timeoutMessage));
      controller.signal.addEventListener("abort", onAbort, { once: true });

      promise.then(resolve, reject).finally(() => {
        controller.signal.removeEventListener("abort", onAbort);
      });
    });
  };

  try {
    // Make sure we have a valid session. If auth itself stalls, the same
    // upload timeout still releases the UI instead of spinning forever.
    const {
      data: { session },
      error: sessionErr,
    } = await withUploadTimeout(supabase.auth.getSession());

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

    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) {
      throw new Error(
        "Supabase anon key isn't configured. Set NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }

    const endpoint = `${baseUrl.replace(
      /\/$/,
      ""
    )}/storage/v1/object/${encodeURIComponent(bucket)}/${path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;

    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);

    const res = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${session.access_token}`,
        "x-upsert": upsert ? "true" : "false",
      },
      body,
    });

    if (!res.ok) {
      throw new Error(await uploadErrorMessage(res, bucket));
    }
  } catch (e) {
    if (
      (e instanceof DOMException && e.name === "AbortError") ||
      (e instanceof Error && e.message === timeoutMessage)
    ) {
      throw new Error(timeoutMessage);
    }
    throw e instanceof Error ? e : new Error("Network error during upload.");
  } finally {
    clearTimeout(timer);
  }
}

async function uploadErrorMessage(res: Response, bucket: string) {
  let detail = "";

  try {
    const body = (await res.json()) as {
      message?: string;
      error?: string;
      statusCode?: string;
    };
    detail = body.message || body.error || "";
  } catch {
    detail = await res.text().catch(() => "");
  }

  if (res.status === 404 && /bucket/i.test(detail)) {
    return `Storage bucket "${bucket}" doesn't exist. Run the Supabase migration (supabase/schema.sql) to create it.`;
  }

  return detail || `Upload failed with HTTP ${res.status}. Please try again.`;
}
