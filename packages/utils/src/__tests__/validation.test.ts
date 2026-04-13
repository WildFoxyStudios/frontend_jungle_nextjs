import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  postSchema,
  profileSchema,
  groupSchema,
  eventSchema,
  productSchema,
  jobSchema,
} from "../validation";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({ identifier: "user@example.com", password: "password123" });
    expect(result.success).toBe(true);
  });

  it("rejects empty identifier", () => {
    const result = loginSchema.safeParse({ identifier: "", password: "password123" });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({ identifier: "user@example.com", password: "short" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toBeDefined();
    }
  });

  it("accepts optional 2FA code", () => {
    const result = loginSchema.safeParse({
      identifier: "user@example.com",
      password: "password123",
      two_factor_code: "123456",
    });
    expect(result.success).toBe(true);
  });
});

describe("registerSchema", () => {
  const valid = {
    username: "johndoe",
    email: "john@example.com",
    password: "password123",
    first_name: "John",
    last_name: "Doe",
  };

  it("accepts valid registration data", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects username shorter than 3 chars", () => {
    const result = registerSchema.safeParse({ ...valid, username: "ab" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects username with special chars", () => {
    const result = registerSchema.safeParse({ ...valid, username: "john doe!" });
    expect(result.success).toBe(false);
  });

  it("accepts optional invite_code", () => {
    const result = registerSchema.safeParse({ ...valid, invite_code: "ABC123" });
    expect(result.success).toBe(true);
  });
});

describe("postSchema", () => {
  it("accepts valid post", () => {
    const result = postSchema.safeParse({ content: "Hello world", privacy: "public" });
    expect(result.success).toBe(true);
  });

  it("rejects content over 5000 chars", () => {
    const result = postSchema.safeParse({ content: "a".repeat(5001), privacy: "public" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid privacy value", () => {
    const result = postSchema.safeParse({ content: "Hello", privacy: "everyone" });
    expect(result.success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("accepts valid profile", () => {
    const result = profileSchema.safeParse({ first_name: "John", last_name: "Doe" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid website URL", () => {
    const result = profileSchema.safeParse({
      first_name: "John",
      last_name: "Doe",
      website: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty website string", () => {
    const result = profileSchema.safeParse({
      first_name: "John",
      last_name: "Doe",
      website: "",
    });
    expect(result.success).toBe(true);
  });
});
