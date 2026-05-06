/**
 * Admin Next.js app base URL. When unset, same-origin `/admin` (reverse proxy).
 */
export function getAdminPanelUrl(): string {
  const url = process.env.NEXT_PUBLIC_ADMIN_URL?.trim();
  if (url) return url;
  return "/admin";
}

function truthyRole(v: unknown): boolean {
  return v === true || v === 1 || v === "1" || v === "true";
}

/** Full admin or site moderator (PHP Wo_IsAdmin / Wo_IsModerator). */
export function userCanAccessAdminPanel(
  user: { is_admin?: unknown; is_moderator?: unknown } | null | undefined,
): boolean {
  if (!user) return false;
  return truthyRole(user.is_admin) || truthyRole(user.is_moderator);
}
