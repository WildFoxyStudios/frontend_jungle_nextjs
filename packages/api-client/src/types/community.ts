import type { PublicUser } from "./user";

export interface Group {
  id: number;
  name: string;
  title?: string;
  description: string;
  avatar: string;
  cover: string;
  privacy: "public" | "private" | "secret";
  member_count: number;
  post_count: number;
  my_role?: "admin" | "moderator" | "member" | "pending";
  category: string;
  is_verified?: boolean;
  is_official?: boolean;
  is_joined: boolean;
  admins: PublicUser[];
  created_at: string;
}

export interface Page {
  id: number;
  name: string;
  description: string;
  avatar: string;
  cover: string;
  category: string;
  like_count: number;
  rating: number;
  rating_count: number;
  is_liked: boolean;
  is_admin: boolean;
  is_verified: boolean;
  website?: string;
  address?: string;
  phone?: string;
  call_action_type?: string;
  call_action_type_url?: string;
  my_role?: "admin" | "moderator";
  admins: PublicUser[];
  created_at: string;
  social_links?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
    github?: string;
    website?: string;
  };
  notification_settings?: {
    new_follower: boolean;
    new_like: boolean;
    new_comment: boolean;
    new_mention: boolean;
    new_message: boolean;
    new_review: boolean;
  };
  autoresponder?: {
    enabled: boolean;
    message: string;
    delay_minutes: number;
  };
}

export interface Event {
  id: number;
  title: string;
  description: string;
  cover: string;
  start_date: string;
  end_date: string;
  location: string;
  going_count: number;
  interested_count: number;
  my_rsvp?: "going" | "interested" | "not_going";
  my_response?: "going" | "interested" | "not_going";
  organizer: PublicUser;
  created_at: string;
}
