import { describe, expect, it } from "vitest";
import { loginRedirectTarget, safeNextPath } from "./safe-next-path";

describe("safeNextPath", () => {
  it("allows internal paths", () => {
    expect(safeNextPath("/events/1/settings")).toBe("/events/1/settings");
    expect(safeNextPath("%2Fmarketplace%2Fcheckout")).toBe("/marketplace/checkout");
  });

  it("rejects open redirects", () => {
    expect(safeNextPath("//evil.com")).toBeNull();
    expect(safeNextPath("https://evil.com")).toBeNull();
    expect(safeNextPath("javascript:alert(1)")).toBeNull();
    expect(safeNextPath("foo")).toBeNull();
  });
});

describe("loginRedirectTarget", () => {
  it("defaults to feed", () => {
    expect(loginRedirectTarget(null)).toBe("/feed");
    expect(loginRedirectTarget("//x")).toBe("/feed");
  });
});
