import type { PublicUser } from "./user";

export type NotificationType =
  | "following"
  | "follow_accepted"
  | "liked_post"
  | "reaction"
  | "shared_post"
  | "comment"
  | "comment_reply"
  | "comment_mention"
  | "post_mention"
  | "joined_group"
  | "group_join_request"
  | "group_post_approval"
  | "group_invite"
  | "liked_page"
  | "page_mention"
  | "event_invite"
  | "event_reminder"
  | "message_reaction"
  | "new_order"
  | "order_status"
  | "job_application"
  | "report"
  | "pro_expiring"
  | "pro_expired"
  | "admin_notice"
  | "memory"
  | "story_reply"
  | "birthday"
  | "live_stream"
  | "funding_donation"
  | "funding_goal_reached";

export interface Notification {
  id: number;
  type: NotificationType;
  actor: PublicUser;
  subject_id?: number;
  subject_type?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: "info" | "warning" | "success" | "error";
  is_active: boolean;
  created_at: string;
}
