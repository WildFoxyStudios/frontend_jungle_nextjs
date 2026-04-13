import { describe, it, expect } from "vitest";
import { parseHashtags, extractHashtags, highlightHashtags } from "../hashtags";

describe("parseHashtags", () => {
  it("parses a single hashtag", () => {
    const result = parseHashtags("Hello #world!");
    expect(result).toHaveLength(1);
    expect(result[0]?.tag).toBe("world");
  });

  it("parses multiple hashtags", () => {
    const result = parseHashtags("#react and #typescript are great");
    expect(result).toHaveLength(2);
    expect(result.map((h) => h.tag)).toEqual(["react", "typescript"]);
  });

  it("returns empty array when no hashtags", () => {
    expect(parseHashtags("No hashtags here")).toHaveLength(0);
  });

  it("parses hashtags with unicode characters", () => {
    const result = parseHashtags("#café and #naïve");
    expect(result).toHaveLength(2);
  });
});

describe("extractHashtags", () => {
  it("extracts tag strings", () => {
    const result = extractHashtags("Post about #coding and #webdev");
    expect(result).toEqual(["coding", "webdev"]);
  });
});

describe("highlightHashtags", () => {
  it("wraps hashtags in anchor tags", () => {
    const result = highlightHashtags("Check #trending");
    expect(result).toContain('<a href="/hashtag/trending"');
    expect(result).toContain("#trending");
  });
});
