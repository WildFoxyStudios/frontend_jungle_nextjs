import type { PublicUser } from "./user";
import type { MediaItem } from "./post";

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  message_type: "text" | "image" | "video" | "audio" | "sticker" | "gift" | "file";
  media: MediaItem[];
  sticker_url?: string;
  gift?: Gift;
  reply_to?: Message;
  is_favorited: boolean;
  is_pinned: boolean;
  reactions: Record<string, number>;
  my_reaction?: string;
  created_at: string;
  sender: PublicUser;
}

export interface Conversation {
  id: number;
  type: "direct" | "group";
  name?: string;
  avatar?: string;
  last_message?: Message;
  last_message_at: string;
  unread_count: number;
  is_muted: boolean;
  is_pinned: boolean;
  is_archived: boolean;
  color?: string;
  members: ConversationMember[];
}

export interface ConversationMember {
  user: PublicUser;
  role: "admin" | "member";
  joined_at: string;
}

export interface Gift {
  id: number;
  name: string;
  image: string;
  price: number;
  currency: string;
}

export interface StickerPack {
  id: number;
  name: string;
  cover: string;
  stickers: Sticker[];
}

export interface Sticker {
  id: number;
  pack_id: number;
  url: string;
}

export interface Call {
  id: string;
  conversation_id: number;
  caller: PublicUser;
  type: "audio" | "video";
  status: "ringing" | "active" | "ended" | "missed";
  room_name: string;
  started_at?: string;
  ended_at?: string;
}
