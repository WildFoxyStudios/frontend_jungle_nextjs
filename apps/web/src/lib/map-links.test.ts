import { describe, expect, it } from "vitest";
import { googleMapsLatLng, googleMapsSearchQuery } from "./map-links";

describe("map-links", () => {
  it("builds coords URL", () => {
    expect(googleMapsLatLng(48.8566, 2.3522)).toContain("48.8566");
    expect(googleMapsLatLng(48.8566, 2.3522)).toContain("2.3522");
  });

  it("encodes query search URL", () => {
    const u = googleMapsSearchQuery("Calle Mayor, Madrid");
    expect(u.startsWith("https://www.google.com/maps/search/")).toBe(true);
    expect(decodeURIComponent(u)).toContain("Madrid");
  });

  it("handles empty query", () => {
    expect(googleMapsSearchQuery("   ")).toMatch(/^https:\/\/www\.google\.com\/maps$/);
  });
});
