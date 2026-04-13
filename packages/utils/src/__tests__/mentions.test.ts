import { describe, it, expect } from "vitest";
import { parseMentions, extractMentionUsernames, highlightMentions } from "../mentions";

describe("parseMentions", () => {
  it("parses a single mention", () => {
    const result = parseMentions("Hello @johndoe!");
    expect(result).toHaveLength(1);
    expect(result[0]?.username).toBe("johndoe");
  });

  it("parses multiple mentions", () => {
    const result = parseMentions("@alice and @bob are here");
    expect(result).toHaveLength(2);
    expect(result.map((m) => m.username)).toEqual(["alice", "bob"]);
  });

  it("returns empty array when no mentions", () => {
    expect(parseMentions("No mentions here")).toHaveLength(0);
  });

  it("captures correct start/end positions", () => {
    const result = parseMentions("Hi @user!");
    expect(result[0]?.start).toBe(3);
    expect(result[0]?.end).toBe(8);
  });
});

describe("extractMentionUsernames", () => {
  it("extracts usernames from text", () => {
    const result = extractMentionUsernames("Hey @alice and @bob");
    expect(result).toEqual(["alice", "bob"]);
  });
});

describe("highlightMentions", () => {
  it("wraps mentions in anchor tags", () => {
    const result = highlightMentions("Hello @johndoe");
    expect(result).toContain('<a href="/profile/johndoe"');
    expect(result).toContain("@johndoe");
  });
});
