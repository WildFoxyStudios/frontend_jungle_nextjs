import { describe, it, expect } from "vitest";
import {
  buildMetadata,
  buildProfileMetadata,
  buildPostMetadata,
  buildGroupMetadata,
  buildPageMetadata,
  buildBlogMetadata,
  buildEventMetadata,
  buildJobMetadata,
  buildFundingMetadata,
  SITE_NAME,
  BASE_URL,
} from "@/lib/seo";

describe("buildMetadata", () => {
  it("includes title in metadata", () => {
    const meta = buildMetadata({ title: "Test Page" });
    expect(meta.title).toBe(`Test Page | ${SITE_NAME}`);
  });

  it("includes description", () => {
    const meta = buildMetadata({ title: "Test", description: "A test desc" });
    expect(meta.description).toBe("A test desc");
  });

  it("includes open graph image", () => {
    const meta = buildMetadata({ title: "Test", image: "https://img.test/photo.jpg" });
    const ogImages = (meta.openGraph as { images?: unknown[] })?.images;
    expect(ogImages).toBeDefined();
  });
});

describe("buildProfileMetadata", () => {
  it("generates profile metadata", () => {
    const meta = buildProfileMetadata({
      username: "john",
      first_name: "John",
      last_name: "Doe",
      about: "Developer",
      avatar: "https://img.test/avatar.jpg",
    });
    expect(meta.title).toContain("John Doe");
  });
});

describe("buildPostMetadata", () => {
  it("generates post metadata", () => {
    const meta = buildPostMetadata({
      id: 1,
      content: "Hello world this is my post",
      publisher: { first_name: "Jane", last_name: "Doe" },
    });
    expect(meta.title).toContain("Jane Doe");
  });
});

describe("buildGroupMetadata", () => {
  it("generates group metadata", () => {
    const meta = buildGroupMetadata({
      name: "Test Group",
      description: "A test group",
    });
    expect(meta.title).toContain("Test Group");
  });
});

describe("buildPageMetadata", () => {
  it("generates page metadata", () => {
    const meta = buildPageMetadata({
      name: "Test Page",
      description: "A test page",
    });
    expect(meta.title).toContain("Test Page");
  });
});

describe("buildBlogMetadata", () => {
  it("generates blog metadata", () => {
    const meta = buildBlogMetadata({
      title: "Blog Post",
      description: "Blog description",
    });
    expect(meta.title).toContain("Blog Post");
  });
});

describe("buildEventMetadata", () => {
  it("generates event metadata", () => {
    const meta = buildEventMetadata({
      title: "Concert",
      location: "NYC",
    });
    expect(meta.title).toContain("Concert");
  });
});

describe("buildJobMetadata", () => {
  it("generates job metadata", () => {
    const meta = buildJobMetadata({
      title: "Engineer",
      category: "Tech",
      location: "Remote",
    });
    expect(meta.title).toContain("Engineer");
  });
});

describe("buildFundingMetadata", () => {
  it("generates funding metadata", () => {
    const meta = buildFundingMetadata({
      title: "Save the whales",
      description: "Help us save whales",
    });
    expect(meta.title).toContain("Save the whales");
  });
});
