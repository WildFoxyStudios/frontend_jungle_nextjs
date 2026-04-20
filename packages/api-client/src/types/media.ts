import type { PublicUser } from "./user";
import type { MediaItem } from "./post";

export interface Story {
  id: number;
  user_id: number;
  media: MediaItem;
  duration: number;
  view_count: number;
  is_seen: boolean;
  expires_at: string;
  publisher: PublicUser;
  /** Optional overlay text rendered above the story media. */
  text?: string | null;
  created_at: string;
}

export interface StoryGroup {
  user: PublicUser;
  stories: Story[];
  has_unseen: boolean;
}

export interface StoryHighlight {
  id: number;
  user_id: number;
  title: string;
  cover_url: string | null;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface StoryHighlightItem {
  item_id: number;
  story_media_id: number;
  media_type: string;
  media_url: string;
  thumbnail_url: string | null;
  description: string;
  duration: number | null;
  added_at: string;
}

export interface Reel {
  id: number;
  user_id: number;
  video: MediaItem;
  thumbnail: string;
  caption: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  my_reaction?: string;
  publisher: PublicUser;
  created_at: string;
}

export interface Album {
  id: number;
  name: string;
  description?: string;
  cover?: string;
  image_count: number;
  owner: PublicUser;
  created_at: string;
}

export interface AlbumImage {
  id: number;
  album_id: number;
  url: string;
  caption?: string;
  created_at: string;
}

export interface Movie {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  video_url: string;
  genre: string;
  country?: string;
  duration: number;
  release_year?: number;
  is_featured: boolean;
  view_count: number;
  like_count?: number;
  comment_count?: number;
  created_at: string;
}

export interface Game {
  id: number;
  name: string;
  description: string;
  thumbnail: string;
  url: string;
  is_active: boolean;
  play_count: number;
  created_at: string;
}
