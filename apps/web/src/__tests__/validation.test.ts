import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  postSchema,
  commentSchema,
  profileSchema,
  groupSchema,
  eventSchema,
  productSchema,
  jobSchema,
  blogSchema,
  pageSchema,
  fundingSchema,
  messageSchema,
  reportSchema,
  changePasswordSchema,
  adSchema,
  privacySettingsSchema,
} from "@jungle/utils";

describe("loginSchema", () => {
  it("accepts valid input", () => {
    const result = loginSchema.safeParse({ identifier: "user@test.com", password: "12345678" });
    expect(result.success).toBe(true);
  });
  it("rejects empty identifier", () => {
    const result = loginSchema.safeParse({ identifier: "", password: "12345678" });
    expect(result.success).toBe(false);
  });
  it("rejects short password", () => {
    const result = loginSchema.safeParse({ identifier: "user@test.com", password: "123" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts valid input", () => {
    const result = registerSchema.safeParse({
      username: "john_doe",
      email: "john@test.com",
      password: "12345678",
      first_name: "John",
      last_name: "Doe",
    });
    expect(result.success).toBe(true);
  });
  it("rejects invalid username chars", () => {
    const result = registerSchema.safeParse({
      username: "john doe!",
      email: "john@test.com",
      password: "12345678",
      first_name: "John",
      last_name: "Doe",
    });
    expect(result.success).toBe(false);
  });
  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      username: "john_doe",
      email: "not-an-email",
      password: "12345678",
      first_name: "John",
      last_name: "Doe",
    });
    expect(result.success).toBe(false);
  });
});

describe("postSchema", () => {
  it("accepts valid post", () => {
    const result = postSchema.safeParse({ content: "Hello world", privacy: "public" });
    expect(result.success).toBe(true);
  });
  it("rejects too long content", () => {
    const result = postSchema.safeParse({ content: "a".repeat(5001), privacy: "public" });
    expect(result.success).toBe(false);
  });
  it("rejects invalid privacy", () => {
    const result = postSchema.safeParse({ content: "Hello", privacy: "invalid" });
    expect(result.success).toBe(false);
  });
});

describe("commentSchema", () => {
  it("rejects empty comment", () => {
    expect(commentSchema.safeParse({ content: "" }).success).toBe(false);
  });
  it("accepts valid comment", () => {
    expect(commentSchema.safeParse({ content: "Nice!" }).success).toBe(true);
  });
});

describe("profileSchema", () => {
  it("accepts valid profile", () => {
    const result = profileSchema.safeParse({ first_name: "John", last_name: "Doe" });
    expect(result.success).toBe(true);
  });
  it("accepts profile with website", () => {
    const result = profileSchema.safeParse({
      first_name: "John",
      last_name: "Doe",
      website: "https://example.com",
    });
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
});

describe("groupSchema", () => {
  it("accepts valid group", () => {
    const result = groupSchema.safeParse({
      name: "Test Group",
      category: "tech",
      privacy: "public",
    });
    expect(result.success).toBe(true);
  });
  it("rejects short name", () => {
    const result = groupSchema.safeParse({ name: "AB", category: "tech", privacy: "public" });
    expect(result.success).toBe(false);
  });
});

describe("eventSchema", () => {
  it("accepts valid event", () => {
    const result = eventSchema.safeParse({
      title: "Party",
      start_date: "2025-01-01",
      end_date: "2025-01-02",
    });
    expect(result.success).toBe(true);
  });
});

describe("productSchema", () => {
  it("rejects negative price", () => {
    const result = productSchema.safeParse({
      title: "Widget",
      description: "A widget",
      price: -5,
      currency: "USD",
      category: "tech",
    });
    expect(result.success).toBe(false);
  });
});

describe("jobSchema", () => {
  it("accepts valid job", () => {
    const result = jobSchema.safeParse({
      title: "Engineer",
      description: "Build things for the team!",
      category: "tech",
      location: "Remote",
      job_type: "full_time",
    });
    expect(result.success).toBe(true);
  });
});

describe("blogSchema", () => {
  it("rejects too short content", () => {
    const result = blogSchema.safeParse({
      title: "Title",
      content: "Short",
      category: "tech",
    });
    expect(result.success).toBe(false);
  });
  it("accepts valid blog", () => {
    const result = blogSchema.safeParse({
      title: "My Blog",
      content: "a".repeat(100),
      category: "tech",
    });
    expect(result.success).toBe(true);
  });
});

describe("pageSchema", () => {
  it("accepts valid page", () => {
    const result = pageSchema.safeParse({ name: "My Page", category: "business" });
    expect(result.success).toBe(true);
  });
});

describe("fundingSchema", () => {
  it("rejects non-positive goal", () => {
    const result = fundingSchema.safeParse({
      title: "Fund",
      description: "Help me build something great and wonderful",
      goal_amount: 0,
      currency: "USD",
    });
    expect(result.success).toBe(false);
  });
});

describe("messageSchema", () => {
  it("rejects empty message", () => {
    expect(messageSchema.safeParse({ content: "" }).success).toBe(false);
  });
});

describe("reportSchema", () => {
  it("accepts valid report", () => {
    const result = reportSchema.safeParse({ reason: "spam" });
    expect(result.success).toBe(true);
  });
  it("rejects invalid reason", () => {
    const result = reportSchema.safeParse({ reason: "invalid_reason" });
    expect(result.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("rejects mismatched passwords", () => {
    const result = changePasswordSchema.safeParse({
      current_password: "old12345",
      new_password: "new12345",
      confirm_password: "different",
    });
    expect(result.success).toBe(false);
  });
  it("accepts matching passwords", () => {
    const result = changePasswordSchema.safeParse({
      current_password: "old12345",
      new_password: "new12345",
      confirm_password: "new12345",
    });
    expect(result.success).toBe(true);
  });
});

describe("adSchema", () => {
  it("accepts valid ad", () => {
    const result = adSchema.safeParse({
      name: "My Ad",
      audience: "all",
      budget: 100,
      post_id: 1,
    });
    expect(result.success).toBe(true);
  });
});

describe("privacySettingsSchema", () => {
  it("accepts valid settings", () => {
    const result = privacySettingsSchema.safeParse({
      who_can_see_posts: "everyone",
      who_can_message: "followers",
      confirm_followers: true,
      show_online_status: true,
      show_last_seen: false,
    });
    expect(result.success).toBe(true);
  });
});
