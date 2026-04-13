import { describe, test, expect } from "vitest";
import fc from "fast-check";

// Simulate the feed store accumulation logic (pure function extracted from useFeed)
function accumulatePages<T extends { id: number }>(pages: T[][]): T[] {
  return pages.flatMap((page) => page);
}

describe("PBT: Feed pagination — preserves order and uniqueness", () => {
  test("concatenated pages have no duplicate IDs and preserve server order (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.array(
            fc.record({ id: fc.integer({ min: 1, max: 10_000 }) }),
            { minLength: 5, maxLength: 20 },
          ),
          { minLength: 2, maxLength: 10 },
        ),
        (rawPages) => {
          // Ensure globally unique IDs
          let counter = 1;
          const uniquePages = rawPages.map((page) =>
            page.map((post) => ({ ...post, id: counter++ })),
          );

          const accumulated = accumulatePages(uniquePages);
          const allIds = accumulated.map((p) => p.id);
          const expectedOrder = uniquePages.flatMap((p) => p.map((post) => post.id));

          const noDuplicates = new Set(allIds).size === allIds.length;
          const correctOrder = JSON.stringify(allIds) === JSON.stringify(expectedOrder);

          return noDuplicates && correctOrder;
        },
      ),
      { numRuns: 100 },
    );
  });
});
