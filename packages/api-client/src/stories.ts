import { api } from "./client";
import type {
  StoryGroup,
  Story,
  StoryHighlight,
  StoryHighlightItem,
  StoryViewerUser,
  PublicUser,
  PaginatedResponse,
  MediaItem,
} from "./types/index";

interface RawStoryMedia {
  id: number;
  story_id: number;
  media_type: string;
  media_url: string;
  thumbnail_url?: string | null;
  description?: string | null;
  duration?: number | null;
  filter_css?: string | null;
  text_style_color?: string | null;
  text_style_font?: string | null;
  created_at: string;
}

interface RawStoryBucket {
  id: number;
  user_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  created_at: string;
  expires_at: string;
  media: RawStoryMedia[];
  view_count?: number;
  has_viewed?: boolean;
}

interface RawCreateStoryResponse {
  story_id: number;
  media: RawStoryMedia;
}

interface HighlightDetailPayload {
  highlight: StoryHighlight;
  items: StoryHighlightItem[];
}

interface WrappedData<T> {
  data: T;
}

function unwrapCreatedStory(response: { data?: RawCreateStoryResponse } | RawCreateStoryResponse): RawCreateStoryResponse {
  if ("story_id" in response) {
    return response;
  }

  if (response.data) {
    return response.data;
  }

  throw new Error("Invalid create story response");
}

function unwrapData<T>(response: WrappedData<T> | T): T {
  if (typeof response === "object" && response !== null && "data" in response) {
    return response.data;
  }

  return response;
}

function toPublisher(raw: Partial<RawStoryBucket>): PublicUser {
  return {
    id: Number(raw.user_id ?? 0),
    uuid: "",
    username: raw.username ?? "",
    first_name: raw.first_name ?? "",
    last_name: raw.last_name ?? "",
    avatar: raw.avatar ?? "",
    is_verified: false,
    is_online: false,
    is_pro: 0,
  };
}

function toMediaItem(raw: RawStoryMedia): MediaItem {
  // Build the object step-by-step so we can omit optional fields entirely when
  // they're missing (required by `exactOptionalPropertyTypes`).
  const item: MediaItem = {
    id: Number(raw.id),
    url: raw.media_url,
    type: raw.media_type as MediaItem["type"],
  };
  if (raw.thumbnail_url) item.thumbnail = raw.thumbnail_url;
  if (raw.duration != null) item.duration = raw.duration;
  return item;
}

function toStory(
  raw: RawStoryMedia,
  context: {
    storyId: number;
    userId: number;
    publisher: PublicUser;
    expiresAt: string;
    // `undefined` allowed so bucket data with missing fields flows through
    // cleanly under `exactOptionalPropertyTypes`.
    createdAt?: string | undefined;
    viewCount?: number | undefined;
    hasViewed?: boolean | undefined;
  },
): Story {
  const duration = raw.duration ?? (raw.media_type === "video" ? 15 : 5);

  return {
    id: Number(raw.id),
    story_id: Number(context.storyId),
    story_media_id: Number(raw.id),
    user_id: Number(context.userId),
    media: toMediaItem(raw),
    duration,
    view_count: Number(context.viewCount ?? 0),
    is_seen: Boolean(context.hasViewed),
    expires_at: context.expiresAt,
    publisher: context.publisher,
    text: raw.description ?? null,
    filter_css: raw.filter_css ?? null,
    text_style_color: raw.text_style_color ?? null,
    text_style_font: raw.text_style_font ?? null,
    created_at: raw.created_at ?? context.createdAt ?? context.expiresAt,
  };
}

export const storiesApi = {
  getStories: async (): Promise<StoryGroup[]> => {
    const buckets = await api.get<RawStoryBucket[]>("/v1/stories");

    return buckets
      .map((bucket) => {
        const publisher = toPublisher(bucket);
        return {
          user: publisher,
          stories: (bucket.media ?? []).map((media) =>
            toStory(media, {
              storyId: bucket.id,
              userId: bucket.user_id,
              publisher,
              expiresAt: bucket.expires_at,
              createdAt: bucket.created_at,
              viewCount: bucket.view_count,
              hasViewed: bucket.has_viewed,
            }),
          ),
          has_unseen: !bucket.has_viewed,
        };
      })
      .filter((group) => group.stories.length > 0);
  },
  getMyStories: async (): Promise<Story[]> => {
    const buckets = await api.get<RawStoryBucket[]>("/v1/stories/my");
    const publisher = toPublisher({});

    return buckets.flatMap((bucket) =>
      (bucket.media ?? []).map((media) =>
        toStory(media, {
          storyId: bucket.id,
          userId: bucket.user_id,
          publisher,
          expiresAt: bucket.expires_at,
          createdAt: bucket.created_at,
          viewCount: bucket.view_count,
          hasViewed: bucket.has_viewed,
        }),
      ),
    );
  },
  getArchivedStories: () => api.get<Story[]>("/v1/stories/archive"),
  getStory: (id: number) => api.get<Story>(`/v1/stories/${id}`),
  createStory: async (formData: FormData, onProgress?: (pct: number) => void): Promise<Story> => {
    const response = await api.upload<{ data?: RawCreateStoryResponse } | RawCreateStoryResponse>(
      "/v1/stories",
      formData,
      onProgress,
    );
    const raw = unwrapCreatedStory(response);
    const publisher = toPublisher({});

    return toStory(raw.media, {
      storyId: raw.story_id,
      userId: 0,
      publisher,
      expiresAt: "",
    });
  },
  deleteStory: (id: number) => api.delete<void>(`/v1/stories/${id}`),
  viewStory: (id: number) => api.post<void>(`/v1/stories/${id}/view`),
  reactToStory: (id: number, reaction: string) =>
    api.post<void>(`/v1/stories/${id}/react`, { reaction }),
  getStoryReactions: (id: number) => api.get<unknown[]>(`/v1/stories/${id}/reactions`),
  getStoryViewers: (id: number) => api.get<StoryViewerUser[]>(`/v1/stories/${id}/viewers`),
  replyToStory: (id: number, text: string) =>
    api.post<void>(`/v1/stories/${id}/reply`, { text }),

  // Story Highlights — permanent collections pinned to profile
  getMyHighlights: (cursor?: string) =>
    api.get<PaginatedResponse<StoryHighlight>>("/v1/story-highlights/my", { cursor }),
  getUserHighlights: (userId: number, cursor?: string) =>
    api.get<PaginatedResponse<StoryHighlight>>(`/v1/users/${userId}/story-highlights`, { cursor }),
  getHighlight: async (id: number, cursor?: string): Promise<HighlightDetailPayload> => {
    const response = await api.get<WrappedData<HighlightDetailPayload> | HighlightDetailPayload>(
      `/v1/story-highlights/${id}`,
      { cursor },
    );

    return unwrapData(response);
  },
  createHighlight: async (data: { title: string; cover_url?: string; story_media_ids?: number[] }): Promise<StoryHighlight> => {
    const response = await api.post<WrappedData<StoryHighlight> | StoryHighlight>("/v1/story-highlights", data);
    return unwrapData(response);
  },
  updateHighlight: async (id: number, data: { title?: string; cover_url?: string }): Promise<StoryHighlight> => {
    const response = await api.put<WrappedData<StoryHighlight> | StoryHighlight>(`/v1/story-highlights/${id}`, data);
    return unwrapData(response);
  },
  deleteHighlight: (id: number) =>
    api.delete<void>(`/v1/story-highlights/${id}`),
  addStoriesToHighlight: async (id: number, storyMediaIds: number[]): Promise<{ added: number }> => {
    const response = await api.post<WrappedData<{ added: number }> | { added: number }>(
      `/v1/story-highlights/${id}/stories`,
      { story_media_ids: storyMediaIds },
    );
    return unwrapData(response);
  },
  removeStoryFromHighlight: (id: number, storyMediaId: number) =>
    api.delete<void>(`/v1/story-highlights/${id}/stories/${storyMediaId}`),
};
