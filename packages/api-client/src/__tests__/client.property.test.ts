import { describe, test, vi, expect } from "vitest";
import fc from "fast-check";
import { ApiClient } from "../client";

describe("PBT: ApiClient — retries 401 exactly once", () => {
  test("fetch is called exactly 2 times on persistent 401 (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          path: fc.string({ minLength: 1 }).map((s) => "/" + s.replace(/\//g, "")),
        }),
        async ({ path }) => {
          let callCount = 0;
          const mockFetch = vi.fn(() => {
            callCount++;
            return Promise.resolve(
              new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
              }),
            );
          });

          // Patch global fetch
          const originalFetch = global.fetch;
          global.fetch = mockFetch;

          const client = new ApiClient("http://test.local");
          callCount = 0;

          try {
            await client.get(path);
          } catch {
            // Expected to throw AuthError
          }

          global.fetch = originalFetch;

          // 1 original + 1 refresh attempt + 1 retry = but refresh also uses fetch
          // The client calls: original request (401) → refresh (fails) → throws
          // So fetch is called: 1 (original) + 1 (refresh) = 2 times
          return callCount === 2;
        },
      ),
      { numRuns: 100 },
    );
  });
});
