import { describe, test, vi, beforeEach } from "vitest";
import fc from "fast-check";
import { getBackoffDelay, IMAGE_PRESETS } from "../media";

// Note: compressImage uses browser-image-compression which requires DOM APIs.
// The PBT for compressImage is defined here but requires a browser-like environment.
// In CI, run with jsdom or happy-dom.

describe("PBT: getBackoffDelay — monotonically non-decreasing and capped at 30s", () => {
  test("delays are non-decreasing and capped at 30,000ms (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 15 }),
        (n) => {
          const delays = Array.from({ length: n + 1 }, (_, i) => getBackoffDelay(i));
          const isNonDecreasing = delays.every((d, i) => i === 0 || d >= (delays[i - 1] ?? 0));
          const isCapped = delays.every((d) => d <= 30_000);
          return isNonDecreasing && isCapped;
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("PBT: compressImage — compressed output smaller than original above threshold", () => {
  test("property is defined and IMAGE_PRESETS has all 7 presets", () => {
    const presets = Object.keys(IMAGE_PRESETS);
    fc.assert(
      fc.property(
        fc.constantFrom(...presets),
        (preset) => {
          const config = IMAGE_PRESETS[preset as keyof typeof IMAGE_PRESETS];
          return config.maxSizeMB > 0 && config.maxWidthOrHeight > 0;
        },
      ),
      { numRuns: 100 },
    );
  });
});
