import { describe, test } from "vitest";
import fc from "fast-check";
import { loginSchema, registerSchema, postSchema } from "../validation";

describe("PBT: Zod schemas — invalid inputs always fail validation", () => {
  test("loginSchema: empty identifier and short password always fail (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.record({
          identifier: fc.constant(""),
          password: fc.string({ maxLength: 7 }),
        }),
        (input) => {
          const result = loginSchema.safeParse(input);
          return (
            result.success === false &&
            Object.keys(result.error.flatten().fieldErrors).length > 0
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  test("registerSchema: short username always fails (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.record({
          username: fc.string({ maxLength: 2 }),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8 }),
          first_name: fc.string({ minLength: 1 }),
          last_name: fc.string({ minLength: 1 }),
        }),
        (input) => {
          const result = registerSchema.safeParse(input);
          // Short username (<=2 chars) should fail
          if (input.username.length < 3) {
            return result.success === false;
          }
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  test("postSchema: content over 5000 chars always fails (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5001, maxLength: 6000 }),
        (content) => {
          const result = postSchema.safeParse({ content, privacy: "public" });
          return result.success === false;
        },
      ),
      { numRuns: 100 },
    );
  });
});
