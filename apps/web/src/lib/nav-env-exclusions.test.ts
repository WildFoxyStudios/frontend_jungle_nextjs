import { describe, expect, it } from "vitest";
import { NAV_SECTIONS } from "@/lib/main-nav-sections";
import { filterNavSectionsByExcludedSet } from "@/lib/nav-env-exclusions";

describe("filterNavSectionsByExcludedSet", () => {
  it("no-ops when excluded is empty", () => {
    expect(filterNavSectionsByExcludedSet(NAV_SECTIONS, new Set())).toEqual(NAV_SECTIONS);
  });

  it("removes matching hrefs from every section", () => {
    const out = filterNavSectionsByExcludedSet(NAV_SECTIONS, new Set(["/pokes", "/nearby"]));
    for (const sec of out) {
      expect(sec.links.some((l) => l.href === "/pokes" || l.href === "/nearby")).toBe(false);
    }
    const shortcuts = out.find((s) => s.sectionKey === "sectionShortcuts");
    expect(shortcuts?.links.find((l) => l.href === "/feed")).toBeUndefined();
    expect(out.map((s) => s.links.length).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
  });
});
