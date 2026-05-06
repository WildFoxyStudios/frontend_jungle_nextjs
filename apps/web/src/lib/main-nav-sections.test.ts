import { describe, expect, it } from "vitest";
import {
  NAV_SECTIONS,
  DEFAULT_NAV_SECTION_KEYS,
  applyPersistedNavOrder,
  cloneNavSections,
  validatedSectionOrder,
  reorderByIndex,
  moveLinkInSection,
  moveSectionByIndex,
  parseNavOrderJson,
  NAV_SECTION_ORDER_JSON_KEY,
} from "@/lib/main-nav-sections";

describe("validatedSectionOrder", () => {
  it("defaults when missing or invalid length", () => {
    expect(validatedSectionOrder(undefined)).toEqual(DEFAULT_NAV_SECTION_KEYS);
    expect(validatedSectionOrder([])).toEqual(DEFAULT_NAV_SECTION_KEYS);
  });

  it("accepts a valid permutation", () => {
    const flipped = [...DEFAULT_NAV_SECTION_KEYS].reverse();
    expect(validatedSectionOrder(flipped)).toEqual(flipped);
  });

  it("rejects duplicate keys", () => {
    const bad = [...DEFAULT_NAV_SECTION_KEYS] as typeof DEFAULT_NAV_SECTION_KEYS;
    (bad as string[])[1] = "sectionShortcuts";
    expect(validatedSectionOrder(bad)).toEqual(DEFAULT_NAV_SECTION_KEYS);
  });
});

describe("reorderByIndex", () => {
  it("no-ops equal indices", () => {
    expect(reorderByIndex(["a", "b"], 0, 0)).toEqual(["a", "b"]);
  });

  it("moves item down to target index", () => {
    /* Move b (index 1) to index 3 → [a,c,d,b]. */
    expect(reorderByIndex(["a", "b", "c", "d"], 1, 3)).toEqual(["a", "c", "d", "b"]);
  });

  it("moves item toward the top", () => {
    expect(reorderByIndex(["a", "b", "c", "d"], 3, 0)).toEqual(["d", "a", "b", "c"]);
  });
});

describe("moveLinkInSection", () => {
  it("same reference when from === to", () => {
    const secs = cloneNavSections(NAV_SECTIONS);
    const home = NAV_SECTIONS[0]!.sectionKey;
    const out = moveLinkInSection(secs, home, 0, 0);
    expect(out).toBe(secs);
  });

  it("preserves multiset of hrefs after reorder", () => {
    const secs = cloneNavSections(NAV_SECTIONS);
    const home = NAV_SECTIONS[0]!.sectionKey;
    const ix = secs.findIndex((s) => s.sectionKey === home);
    if (secs[ix]!.links.length < 2) throw new Error("need 2 links in Home");
    const before = secs[ix]!.links.map((l) => l.href).slice().sort();
    const moved = moveLinkInSection(secs, home, 0, secs[ix]!.links.length - 1);
    const after = moved[ix]!.links.map((l) => l.href).slice().sort();
    expect(after).toEqual(before);
    expect(JSON.stringify(secs[ix]!.links)).not.toStrictEqual(JSON.stringify(moved[ix]!.links));
  });
});

describe("moveSectionByIndex", () => {
  it("preserves multiset of keys after swap edges", () => {
    const secs = cloneNavSections(NAV_SECTIONS);
    const keysBefore = secs.map((s) => s.sectionKey).sort();
    const moved = moveSectionByIndex(secs, 0, secs.length - 1);
    expect(moved.map((s) => s.sectionKey).sort()).toEqual(keysBefore);
    expect(moved[0]?.sectionKey).not.toBe(secs[0]?.sectionKey);
  });
});

describe("parseNavOrderJson / applyPersistedNavOrder", () => {
  it("returns null for empty or invalid", () => {
    expect(parseNavOrderJson(null)).toBeNull();
    expect(parseNavOrderJson("")).toBeNull();
    expect(parseNavOrderJson("{}")).toBeNull();
    expect(parseNavOrderJson("not-json")).toBeNull();
  });

  it("applies href order for one section", () => {
    const home = NAV_SECTIONS[0]!.sectionKey;
    const hrefs = NAV_SECTIONS[0]!.links.map((l) => l.href).reverse();
    const raw = JSON.stringify({ [home]: hrefs });
    const p = parseNavOrderJson(raw);
    expect(p?.[home]).toEqual(hrefs);
    const applied = applyPersistedNavOrder(NAV_SECTIONS, p);
    const ix = applied.findIndex((s) => s.sectionKey === home);
    expect(ix).toBeGreaterThanOrEqual(0);
    expect(applied[ix]!.links.map((l) => l.href)).toEqual(hrefs);
  });

  it("honours _sectionOrder when valid", () => {
    const order = [...DEFAULT_NAV_SECTION_KEYS].reverse();
    const payload: Record<string, unknown> = {
      [NAV_SECTION_ORDER_JSON_KEY]: order,
    };
    for (const sec of NAV_SECTIONS) {
      payload[sec.sectionKey] = sec.links.map((l) => l.href);
    }
    const p = parseNavOrderJson(JSON.stringify(payload));
    expect(p?._sectionOrder?.[0]).toBe(order[0]);
    const applied = applyPersistedNavOrder(NAV_SECTIONS, p);
    expect(applied[0]!.sectionKey).toBe(order[0]!);
  });
});
