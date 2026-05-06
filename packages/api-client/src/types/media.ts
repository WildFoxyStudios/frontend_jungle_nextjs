import type { PublicUser } from "./user";
import type { MediaItem } from "./post";

export interface Story {
  /** Kept for UI compatibility; equals `story_media_id`. */
  id: number;
  story_id: number;
  story_media_id: number;
  user_id: number;
  media: MediaItem;
  duration: number;
  view_count: number;
  is_seen: boolean;
  expires_at: string;
  publisher: PublicUser;
  /** Optional overlay text rendered above the story media. */
  text?: string | null;
  /** CSS filter string (e.g. "sepia(0.9)"). Applied by the viewer. Plan §3.3 — S3. */
  filter_css?: string | null;
  /** CSS color for the caption overlay. Plan §3.3 — S2. */
  text_style_color?: string | null;
  /** CSS font-family stack for the caption overlay. Plan §3.3 — S2. */
  text_style_font?: string | null;
  created_at: string;
}

export interface StoryGroup {
  user: PublicUser;
  stories: Story[];
  has_unseen: boolean;
}

export interface StoryViewerUser {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  avatar: string;
  viewed_at: string;
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

/** Attached sound on a reel (from `reel_audio_tracks`). */
export interface ReelAudio {
  id: number;
  title: string;
  artist_label: string;
  source: string;
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
  view_count?: number;
  /** 0 = comments allowed, 1 = disabled */
  comments_status?: 0 | 1;
  my_reaction?: string | null;
  /** Viewer follows the reel author (from feed API). */
  is_following?: boolean;
  /** Viewer saved this reel to bookmarks. */
  is_saved?: boolean;
  /** Linked audio metadata, or null if none. */
  audio?: ReelAudio | null;
  remix_of_post_id?: number | null;
  /** When false, only the owner may use this reel as a remix source. */
  allow_remix?: boolean;
  publisher: PublicUser;
  created_at: string;
}

/** Row from GET /v1/reels/audio/trending or search. */
export interface ReelAudioTrackSummary {
  id: number;
  title: string;
  artist_label: string;
  use_count: number;
  source: string;
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
