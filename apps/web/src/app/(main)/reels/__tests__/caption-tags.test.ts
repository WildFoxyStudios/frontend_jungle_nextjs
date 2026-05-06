import { describe, it, expect } from "vitest";

/** Mirrors CaptionWithTags split behavior (hashtags / mentions / plain segments). */
function splitCaption(text: string) {
  return text.split(/(#[\w]+|@[\w]+)/g);
}

describe("reel caption hashtag split", () => {
  it("splits on hash tokens", () => {
    const p = splitCaption("hi #reels there");
    expect(p).toEqual(["hi ", "#reels", " there"]);
  });

  it("splits mentions and hashtags", () => {
    const p = splitCaption("hi @you and #reels");
    expect(p).toEqual(["hi ", "@you", " and ", "#reels", ""]);
  });
});
