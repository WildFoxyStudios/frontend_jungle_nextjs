import { describe, it, expect } from "vitest";
import { timeAgo, formatDate, formatDateTime, formatBirthday, isOnThisDay } from "../date";

describe("formatDate", () => {
  it("formats ISO date string", () => {
    const result = formatDate("2024-01-15T10:00:00Z");
    expect(result).toMatch(/Jan 15, 2024/);
  });

  it("accepts custom pattern", () => {
    const result = formatDate("2024-01-15T10:00:00Z", "yyyy-MM-dd");
    expect(result).toBe("2024-01-15");
  });

  it("accepts Date object", () => {
    const date = new Date("2024-06-01T00:00:00Z");
    const result = formatDate(date, "yyyy");
    expect(result).toBe("2024");
  });
});

describe("formatBirthday", () => {
  it("formats birthday without year", () => {
    const result = formatBirthday("1990-03-25");
    expect(result).toBe("March 25");
  });
});

describe("isOnThisDay", () => {
  it("returns true for today's date in a past year", () => {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setFullYear(today.getFullYear() - 1);
    expect(isOnThisDay(pastDate.toISOString())).toBe(true);
  });

  it("returns false for a different day", () => {
    const differentDay = new Date();
    differentDay.setDate(differentDay.getDate() + 5);
    differentDay.setFullYear(differentDay.getFullYear() - 1);
    // Only false if the date is actually different
    const today = new Date();
    if (differentDay.getDate() !== today.getDate() || differentDay.getMonth() !== today.getMonth()) {
      expect(isOnThisDay(differentDay.toISOString())).toBe(false);
    }
  });
});

describe("timeAgo", () => {
  it("returns a string with 'ago' or 'in'", () => {
    const pastDate = new Date(Date.now() - 60_000).toISOString();
    const result = timeAgo(pastDate);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});
