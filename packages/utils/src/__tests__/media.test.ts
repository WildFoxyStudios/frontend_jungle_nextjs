import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBackoffDelay, IMAGE_PRESETS } from "../media";

// Note: compressImage and validateVideo require browser APIs (DOM, canvas, video element).
// These tests cover the pure logic and the mock-able parts.

describe("getBackoffDelay", () => {
  it("returns 1000ms for attempt 0", () => {
    expect(getBackoffDelay(0)).toBe(1000);
  });

  it("returns 2000ms for attempt 1", () => {
    expect(getBackoffDelay(1)).toBe(2000);
  });

  it("returns 4000ms for attempt 2", () => {
    expect(getBackoffDelay(2)).toBe(4000);
  });

  it("caps at 30000ms for large attempts", () => {
    expect(getBackoffDelay(10)).toBe(30_000);
    expect(getBackoffDelay(20)).toBe(30_000);
    expect(getBackoffDelay(100)).toBe(30_000);
  });

  it("is monotonically non-decreasing", () => {
    const delays = Array.from({ length: 10 }, (_, i) => getBackoffDelay(i));
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1]!);
    }
  });
});

describe("IMAGE_PRESETS", () => {
  it("has all 7 presets", () => {
    const expected = ["post", "avatar", "cover", "story", "chat", "blog", "product"];
    expect(Object.keys(IMAGE_PRESETS)).toEqual(expect.arrayContaining(expected));
    expect(Object.keys(IMAGE_PRESETS)).toHaveLength(7);
  });

  it("post preset has correct values", () => {
    expect(IMAGE_PRESETS.post).toEqual({ maxSizeMB: 2, maxWidthOrHeight: 1920 });
  });

  it("avatar preset has correct values", () => {
    expect(IMAGE_PRESETS.avatar).toEqual({ maxSizeMB: 0.5, maxWidthOrHeight: 400 });
  });

  it("all presets have positive maxSizeMB and maxWidthOrHeight", () => {
    for (const [, config] of Object.entries(IMAGE_PRESETS)) {
      expect(config.maxSizeMB).toBeGreaterThan(0);
      expect(config.maxWidthOrHeight).toBeGreaterThan(0);
    }
  });
});

describe("compressImage — behavior contract", () => {
  it("IMAGE_PRESETS defines the skip threshold correctly", () => {
    // If file.size <= maxSizeMB * 1024 * 1024, compression is skipped
    const avatarLimitBytes = IMAGE_PRESETS.avatar.maxSizeMB * 1024 * 1024;
    expect(avatarLimitBytes).toBe(0.5 * 1024 * 1024); // 524288 bytes
  });
});
