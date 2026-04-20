import { api } from "./client";
import type { Event, PaginatedResponse, PublicUser } from "./types/index";

export const eventsApi = {
  getUpcoming: (cursor?: string) =>
    api.get<PaginatedResponse<Event>>("/v1/events/upcoming", { cursor }),
  getMyEvents: (cursor?: string) =>
    api.get<PaginatedResponse<Event>>("/v1/events/my", { cursor }),
  getAttending: (cursor?: string) =>
    api.get<PaginatedResponse<Event>>("/v1/events/attending", { cursor }),
  getPastEvents: (cursor?: string) =>
    api.get<PaginatedResponse<Event>>("/v1/events/past", { cursor }),
  getGoingEvents: (cursor?: string) =>
    api.get<PaginatedResponse<Event>>("/v1/events/going", { cursor }),
  getInterestedEvents: (cursor?: string) =>
    api.get<PaginatedResponse<Event>>("/v1/events/interested", { cursor }),
  getInvitedEvents: (cursor?: string) =>
    api.get<PaginatedResponse<Event>>("/v1/events/invited", { cursor }),
  getEvent: (id: number) => api.get<Event>(`/v1/events/${id}`),
  createEvent: (data: Partial<Event> & { title: string }) =>
    api.post<Event>("/v1/events", data),
  updateEvent: (id: number, data: Partial<Event>) =>
    api.put<Event>(`/v1/events/${id}`, data),
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
};
