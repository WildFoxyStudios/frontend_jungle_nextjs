import { api } from "./client";
import type { StoryGroup, Story, StoryHighlight, StoryHighlightItem, PublicUser, PaginatedResponse } from "./types/index";

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

  // Story Highlights — permanent collections pinned to profile
  getMyHighlights: (cursor?: string) =>
    api.get<PaginatedResponse<StoryHighlight>>("/v1/story-highlights/my", { cursor }),
  getUserHighlights: (userId: number, cursor?: string) =>
    api.get<PaginatedResponse<StoryHighlight>>(`/v1/users/${userId}/story-highlights`, { cursor }),
  getHighlight: (id: number) =>
    api.get<{ highlight: StoryHighlight; items: StoryHighlightItem[] }>(`/v1/story-highlights/${id}`),
  createHighlight: (data: { title: string; cover_url?: string; story_media_ids?: number[] }) =>
    api.post<StoryHighlight>("/v1/story-highlights", data),
  updateHighlight: (id: number, data: { title?: string; cover_url?: string }) =>
    api.put<StoryHighlight>(`/v1/story-highlights/${id}`, data),
  deleteHighlight: (id: number) =>
    api.delete<void>(`/v1/story-highlights/${id}`),
  addStoriesToHighlight: (id: number, storyMediaIds: number[]) =>
    api.post<{ added: number }>(`/v1/story-highlights/${id}/stories`, { story_media_ids: storyMediaIds }),
  removeStoryFromHighlight: (id: number, storyMediaId: number) =>
    api.delete<void>(`/v1/story-highlights/${id}/stories/${storyMediaId}`),
};
