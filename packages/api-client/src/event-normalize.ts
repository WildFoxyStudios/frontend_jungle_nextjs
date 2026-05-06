import type { Event, PublicUser } from "./types/index";

function stubOrganizer(creatorId: number): PublicUser {
  return {
    id: creatorId,
    uuid: "00000000-0000-0000-0000-000000000000",
    username: "",
    first_name: "",
    last_name: "",
    avatar: "",
    is_verified: false,
    is_online: false,
    is_pro: 0,
  };
}

function pickString(row: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return "";
}

function pickOptionalNumber(row: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return undefined;
}

function coerceCount(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function rowToEvent(
  row: Record<string, unknown>,
  counts: { going_count: number; interested_count: number },
  extras: { my_response?: Event["my_response"]; organizer?: PublicUser },
): Event {
  const id = typeof row.id === "number" ? row.id : Number(row.id);
  const creatorId =
    typeof row.creator_id === "number"
      ? row.creator_id
      : typeof row.creator_id === "string"
        ? Number(row.creator_id)
        : 0;

  const organizer =
    extras.organizer ??
    (typeof row.organizer === "object" && row.organizer !== null
      ? (row.organizer as PublicUser)
      : stubOrganizer(Number.isFinite(creatorId) ? creatorId : 0));

  const myResp = extras.my_response ?? row.my_response ?? row.my_rsvp;
  const response =
    myResp === "going" || myResp === "interested" || myResp === "not_going"
      ? myResp
      : undefined;

  const lat = pickOptionalNumber(row, ["latitude", "lat"]);
  const lng = pickOptionalNumber(row, ["longitude", "lng", "lon"]);

  return {
    id: Number.isFinite(id) ? id : 0,
    title: pickString(row, ["title", "name"]),
    description: pickString(row, ["description"]),
    cover: pickString(row, ["cover"]),
    start_date: pickString(row, ["start_date", "start_at"]),
    end_date: pickString(row, ["end_date", "end_at"]),
    location: pickString(row, ["location"]),
    ...(lat !== undefined ? { latitude: lat } : {}),
    ...(lng !== undefined ? { longitude: lng } : {}),
    going_count: counts.going_count,
    interested_count: counts.interested_count,
    ...(response !== undefined ? { my_response: response, my_rsvp: response } : {}),
    organizer,
    created_at: pickString(row, ["created_at"]),
  };
}

/**
 * Normalizes raw JSON from `GET /v1/events/:id` (nested `{ event }` + counts)
 * or a flat event row (`POST`/`PUT` unwrap).
 */
export function normalizeEventPayload(payload: unknown): Event {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid event payload");
  }
  const p = payload as Record<string, unknown>;
  const row =
    "event" in p && p.event && typeof p.event === "object"
      ? (p.event as Record<string, unknown>)
      : p;

  const gc =
    typeof p.going_count === "number"
      ? p.going_count
      : typeof row.going_count === "number"
        ? row.going_count
        : 0;
  const ic =
    typeof p.interested_count === "number"
      ? p.interested_count
      : typeof row.interested_count === "number"
        ? row.interested_count
        : 0;

  const myResp = p.my_response ?? row.my_response ?? row.my_rsvp;
  const response =
    myResp === "going" || myResp === "interested" || myResp === "not_going"
      ? myResp
      : undefined;

  return rowToEvent(row, { going_count: gc, interested_count: ic }, { my_response: response });
}

/**
 * Maps list/card payloads (`EventSummary` — `name`, `start_at`, counts, optional geo).
 */
export function normalizeEventListItem(raw: unknown): Event {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid event summary");
  }
  const row = raw as Record<string, unknown>;
  const gc = coerceCount(row.going_count);
  const ic = coerceCount(row.interested_count);
  return rowToEvent(row, { going_count: gc, interested_count: ic }, {});
}
