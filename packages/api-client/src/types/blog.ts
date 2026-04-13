import type { PublicUser } from "./user";

export interface Blog {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  cover?: string;
  category: string;
  tags: string[];
  like_count: number;
  comment_count: number;
  view_count: number;
  my_reaction?: string;
  is_approved: boolean;
  author: PublicUser;
  created_at: string;
  updated_at: string;
}

export interface ForumSection {
  id: number;
  name: string;
  description: string;
  forum_count: number;
  thread_count: number;
  forums?: Forum[];
}

export interface Forum {
  id: number;
  section_id: number;
  name: string;
  description: string;
  thread_count: number;
  last_post_at?: string;
}

export interface ForumThread {
  id: number;
  forum_id: number;
  title: string;
  content: string;
  reply_count: number;
  view_count: number;
  vote_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  author: PublicUser;
  created_at: string;
}

export interface ForumReply {
  id: number;
  thread_id: number;
  content: string;
  quote_reply_id?: number;
  vote_count: number;
  my_vote?: 1 | -1;
  author: PublicUser;
  created_at: string;
}
