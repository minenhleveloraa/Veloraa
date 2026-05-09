/**
 * Deprecated. Theme is now applied server-side from the `veloraa-theme`
 * cookie inside the root layout — no inline `<script>` is rendered.
 *
 * React 19 + Next.js 16 refuses to execute `<script>` tags inside the React
 * component tree on client-side renders, which crashed the page during any
 * client navigation (the `next/script` wrapper has the same limitation).
 *
 * Kept as a no-op export so any stale imports do not break the build.
 */
export default function ThemeScript() {
  return null;
}
