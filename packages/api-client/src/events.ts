import { api } from "./client";
import { normalizeEventListItem, normalizeEventPayload } from "./event-normalize";
import type { Event, PaginatedResponse, PublicUser } from "./types/index";
import { unwrapPaginated } from "./unwrap";

async function getEventsPaginated(path: string, cursor?: string): Promise<PaginatedResponse<Event>> {
  const raw = await api.get<unknown>(path, cursor !== undefined ? { cursor } : {});
  const page = unwrapPaginated<unknown>(raw);
  return {
    data: page.data.map((row) => normalizeEventListItem(row)),
    meta: page.meta,
  };
}

export const eventsApi = {
  getUpcoming: (cursor?: string) => getEventsPaginated("/v1/events/upcoming", cursor),
  getMyEvents: (cursor?: string) => getEventsPaginated("/v1/events/my", cursor),
  getAttending: (cursor?: string) => getEventsPaginated("/v1/events/attending", cursor),
  getPastEvents: (cursor?: string) => getEventsPaginated("/v1/events/past", cursor),
  getGoingEvents: (cursor?: string) => getEventsPaginated("/v1/events/going", cursor),
  getInterestedEvents: (cursor?: string) => getEventsPaginated("/v1/events/interested", cursor),
  getInvitedEvents: (cursor?: string) => getEventsPaginated("/v1/events/invited", cursor),
  getEvent: async (id: number) => {
    const raw = await api.get<unknown>(`/v1/events/${id}`);
    return normalizeEventPayload(raw);
  },
  createEvent: async (data: Partial<Event> & { title: string }) => {
    const raw = await api.post<unknown>("/v1/events", data);
    return normalizeEventPayload(raw);
  },
  updateEvent: async (id: number, data: Partial<Event>) => {
    const raw = await api.put<unknown>(`/v1/events/${id}`, data);
    return normalizeEventPayload(raw);
  },
  deleteEvent: (id: number) => api.delete<void>(`/v1/events/${id}`),
  respondEvent: (id: number, response: "going" | "interested" | "not_going") =>
    api.post<void>(`/v1/events/${id}/respond`, { response }),
  getGoing: (id: number, cursor?: string) =>
    api.get<PaginatedResponse<PublicUser>>(`/v1/events/${id}/going`, { cursor }),
  getInterested: (id: number, cursor?: string) =>
    api.get<PaginatedResponse<PublicUser>>(`/v1/events/${id}/interested`, { cursor }),
  inviteUsers: (id: number, userIds: number[]) =>
    api.post<void>(`/v1/events/${id}/invite`, { user_ids: userIds }),
  getEventPosts: (id: number, cursor?: string) =>
    api.get<PaginatedResponse<import("./types/index").Post>>(`/v1/events/${id}/posts`, { cursor }),
  uploadEventCover: (id: number, formData: FormData) =>
    api.upload<{ cover: string }>(`/v1/events/${id}/cover`, formData),

  /**
   * Plan §3.5 E1 — return the raw `.ics` URL so the UI can either force a
   * download (window.open) or point a `<a download>` at it directly.
   * The endpoint emits `Content-Disposition: attachment; filename=event-{id}.ics`.
   */
  icsUrl: (id: number) => `/v1/events/${id}/ics`,
};
