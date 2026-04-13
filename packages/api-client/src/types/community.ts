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
  my_role?: "admin" | "moderator";
  admins: PublicUser[];
  created_at: string;
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
  organizer: PublicUser;
  created_at: string;
}
