import type { NavSection } from "@/lib/main-nav-sections";

/**
 * Optional sidebar pruning for deployments where some stock WoWonder-era
 * shortcuts are irrelevant. Set `NEXT_PUBLIC_NAV_EXCLUDED_HREFS` to a
 * comma-separated list of **exact** paths that match `{ href }` entries in
 * `NAV_SECTIONS` (e.g. `/pokes`, `/nearby`, `/wallet`).
 *
 * Routes still exist; users may deep-link. Documented in
 * `plans/frontend-modulos-satellite-y-settings.md`.
 */
export const NAV_EXCLUDED_HREFS: ReadonlySet<string> = (() => {
  const raw = process.env.NEXT_PUBLIC_NAV_EXCLUDED_HREFS;
  const list =
    typeof raw === "string" && raw.trim().length > 0
      ? raw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
  return new Set(list);
})();

/** Drop links whose href is present in `excluded` — pure; used in tests without env tricks. */
export function filterNavSectionsByExcludedSet(
  nav: NavSection[],
  excluded: ReadonlySet<string>,
): NavSection[] {
  if (excluded.size === 0) return nav;
  return nav.map((sec) => ({
    ...sec,
    links: sec.links.filter((l) => !excluded.has(l.href)),
  }));
}

/** Drops excluded links using `NEXT_PUBLIC_NAV_EXCLUDED_HREFS` from the bundle env. */
export function applyExcludedToSections(nav: NavSection[]): NavSection[] {
  return filterNavSectionsByExcludedSet(nav, NAV_EXCLUDED_HREFS);
}
