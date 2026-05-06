import { describe, expect, it } from "vitest";
import { normalizeEventListItem, normalizeEventPayload } from "./event-normalize";

describe("normalizeEventListItem", () => {
  it("maps EventSummary rows (name, start_at, creator_id)", () => {
    const e = normalizeEventListItem({
      id: 9,
      creator_id: 3,
      name: "Meet",
      cover: "x.jpg",
      location: "Oslo",
      latitude: 59.91,
      longitude: 10.75,
      start_at: "2026-07-01T12:00:00Z",
      end_at: "2026-07-01T14:00:00Z",
      going_count: 2,
      interested_count: 5,
    });
    expect(e.title).toBe("Meet");
    expect(e.start_date).toContain("2026-07-01");
    expect(e.going_count).toBe(2);
    expect(e.interested_count).toBe(5);
    expect(e.organizer.id).toBe(3);
    expect(e.latitude).toBe(59.91);
  });
});

describe("normalizeEventPayload", () => {
  it("maps nested group-page GET detail (+ counts) to Event", () => {
    const e = normalizeEventPayload({
      event: {
        id: 42,
        creator_id: 7,
        name: "Meetup",
        description: "Hi",
        location: "Berlin",
        latitude: 52.52,
        longitude: 13.405,
        cover: "c.jpg",
        start_at: "2026-05-01T18:00:00Z",
        end_at: "2026-05-01T20:00:00Z",
        created_at: "2026-04-01T12:00:00Z",
      },
      going_count: 3,
      interested_count: 1,
    });
    expect(e.id).toBe(42);
    expect(e.title).toBe("Meetup");
    expect(e.start_date).toContain("2026-05-01");
    expect(e.end_date).toContain("2026-05-01");
    expect(e.going_count).toBe(3);
    expect(e.interested_count).toBe(1);
    expect(e.latitude).toBe(52.52);
    expect(e.longitude).toBe(13.405);
    expect(e.organizer.id).toBe(7);
  });

  it("maps flat POST/PUT row unwrap to Event", () => {
    const e = normalizeEventPayload({
      id: 1,
      creator_id: 2,
      name: "X",
      description: "",
      location: "",
      cover: "d.jpg",
      start_at: "2026-06-01T10:00:00Z",
      end_at: "2026-06-01T11:00:00Z",
      created_at: "2026-04-01T00:00:00Z",
      going_count: 0,
      interested_count: 0,
    });
    expect(e.title).toBe("X");
    expect(e.organizer.id).toBe(2);
  });
});
