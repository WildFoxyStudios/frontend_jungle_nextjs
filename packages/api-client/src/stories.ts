import { api } from "./client";
import type { StoryGroup, Story, PublicUser } from "./types/index";

export const storiesApi = {
  getStories: () => api.get<StoryGroup[]>("/v1/stories"),
  getMyStories: () => api.get<Story[]>("/v1/stories/my"),
  getArchivedStories: () => api.get<Story[]>("/v1/stories/archive"),
  getStory: (id: number) => api.get<Story>(`/v1/stories/${id}`),
  createStory: (formData: FormData, onProgress?: (pct: number) => void) =>
    api.upload<Story>("/v1/stories", formData, onProgress),
  deleteStory: (id: number) => api.delete<void>(`/v1/stories/${id}`),
  viewStory: (id: number) => api.post<void>(`/v1/stories/${id}/view`),
  reactToStory: (id: number, reaction: string) =>
    api.post<void>(`/v1/stories/${id}/react`, { reaction }),
  getStoryReactions: (id: number) => api.get<unknown[]>(`/v1/stories/${id}/reactions`),
  getStoryViewers: (id: number) => api.get<PublicUser[]>(`/v1/stories/${id}/viewers`),
  replyToStory: (id: number, content: string) =>
    api.post<void>(`/v1/stories/${id}/reply`, { content }),
};
