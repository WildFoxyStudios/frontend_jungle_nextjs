import type { PublicUser } from "./user";
import type { Group } from "./community";

export interface MediaItem {
  id: number;
  url: string;
  type: "image" | "video" | "audio" | "file";
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: number;
  size?: number;
  name?: string;
}

export interface ColoredPost {
  background: string;
  text_color: string;
}

export interface PollOption {
  id: number;
  text: string;
  vote_count: number;
}

export interface Poll {
  id: number;
  question: string;
  options: PollOption[];
  expires_at: string;
  my_vote?: number;
  total_votes: number;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  media?: MediaItem;
  like_count: number;
  my_reaction?: string;
  replies?: Comment[];
  reply_count: number;
  publisher: PublicUser;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: number;
  uuid: string;
  user_id: number;
  content: string;
  post_type:
    | "text"
    | "image"
    | "video"
    | "link"
    | "colored"
    | "poll"
    | "shared"
    | "reel"
    | "story";
  media: MediaItem[];
  colored_post?: ColoredPost;
  privacy: "public" | "friends" | "only_me" | "custom";
  feeling?: string;
  location?: string;
  link_url?: string;
  link_title?: string;
  link_description?: string;
  link_image?: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  my_reaction?: string;
  reaction_counts: Record<string, number>;
  recent_comments: Comment[];
  is_saved: boolean;
  publisher: PublicUser;
  group_info?: Pick<Group, "id" | "name" | "avatar">;
  page_info?: { id: number; name: string; avatar: string };
  shared_post?: Post;
  poll?: Poll;
  created_at: string;
  updated_at: string;
}

export interface ReactionType {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export interface ColoredTemplate {
  id: number;
  background: string;
  text_color: string;
  preview_url?: string;
}
