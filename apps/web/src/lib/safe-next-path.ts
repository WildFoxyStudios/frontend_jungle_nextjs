/**
 * Validates `?next=` (or similar) for post-auth redirects — internal paths only,
 * blocks open redirects (`//evil.com`, `https:…`, newlines, etc.).
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== "string") return null;
  let s = raw.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    return null;
  }
  if (!s.startsWith("/") || s.startsWith("//")) return null;
  if (s.includes("://") || s.includes(":\\") || /[\n\r\0]/.test(s)) return null;
  if (s.length > 2048) return null;
  return s;
}

/** Default `/feed` when `next` is missing or unsafe. */
export function loginRedirectTarget(raw: string | null | undefined): string {
  return safeNextPath(raw) ?? "/feed";
}
