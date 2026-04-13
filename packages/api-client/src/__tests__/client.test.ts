import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiClient } from "../client";
import { AuthError, NetworkError, NotFoundError, ValidationError } from "../errors";

function createMockFetch(responses: { status: number; body: unknown }[]) {
  let callIndex = 0;
  return vi.fn(() => {
    const response = responses[callIndex++] ?? responses[responses.length - 1]!;
    return Promise.resolve(
      new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      }),
    );
  });
}

describe("ApiClient", () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient("http://test.local");
  });

  describe("401 refresh flow", () => {
    it("retries once after 401 and succeeds if refresh works", async () => {
      let callCount = 0;
      const mockFetch = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          // First request: 401
          return Promise.resolve(
            new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            }),
          );
        } else if (callCount === 2) {
          // Refresh: success
          return Promise.resolve(
            new Response(JSON.stringify({ access_token: "new-token" }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        } else {
          // Retry: success
          return Promise.resolve(
            new Response(JSON.stringify({ data: "ok" }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
      });

      global.fetch = mockFetch;
      const result = await client.get<{ data: string }>("/test");
      expect(result.data).toBe("ok");
      expect(callCount).toBe(3); // original + refresh + retry
    });

    it("throws AuthError when refresh fails", async () => {
      const mockFetch = createMockFetch([
        { status: 401, body: { error: { code: "UNAUTHORIZED", message: "Unauthorized" } } },
        { status: 401, body: { error: { code: "UNAUTHORIZED", message: "Unauthorized" } } },
      ]);
      global.fetch = mockFetch;

      await expect(client.get("/test")).rejects.toThrow(AuthError);
    });
  });

  describe("error handling", () => {
    it("throws NotFoundError on 404", async () => {
      global.fetch = createMockFetch([
        { status: 404, body: { error: { code: "NOT_FOUND", message: "Not found" } } },
      ]);
      await expect(client.get("/missing")).rejects.toThrow(NotFoundError);
    });

    it("throws ValidationError on 422", async () => {
      global.fetch = createMockFetch([
        {
          status: 422,
          body: {
            error: {
              code: "VALIDATION_ERROR",
              message: "Validation failed",
              details: { email: ["Invalid email"] },
            },
          },
        },
      ]);
      await expect(client.post("/register", {})).rejects.toThrow(ValidationError);
    });

    it("throws NetworkError on fetch failure", async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error("Network error")));
      await expect(client.get("/test")).rejects.toThrow(NetworkError);
    });
  });

  describe("token management", () => {
    it("sets Authorization header when token is set", async () => {
      client.setToken("my-token");
      let capturedHeaders: Record<string, string> = {};

      global.fetch = vi.fn((_, options) => {
        capturedHeaders = options?.headers as Record<string, string>;
        return Promise.resolve(
          new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } }),
        );
      });

      await client.get("/test");
      expect(capturedHeaders["Authorization"]).toBe("Bearer my-token");
    });

    it("clears token on clearToken()", async () => {
      client.setToken("my-token");
      client.clearToken();
      let capturedHeaders: Record<string, string> = {};

      global.fetch = vi.fn((_, options) => {
        capturedHeaders = options?.headers as Record<string, string>;
        return Promise.resolve(
          new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } }),
        );
      });

      await client.get("/test");
      expect(capturedHeaders["Authorization"]).toBeUndefined();
    });
  });
});
