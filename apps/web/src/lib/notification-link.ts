import type { Notification } from "@jungle/api-client";

/**
 * Maps a notification to the most relevant in-app URL.
 *
 * The PHP original (`sources/classes/Notifications.php`) dispatches on
 * `notification_type` to build a deep link. We replicate that logic here so
 * the header dropdown and the full `/notifications` page share a single
 * source of truth for click targets.
 *
 * Falls back to `/notifications` so the user is never left without a target.
 */
export function getNotificationLink(notification: Notification): string {
  const { type, subject_id, actor } = notification;
  const username = actor?.username;

  switch (type) {
    case "following":
    case "follow_accepted":
    case "birthday":
    case "story_reply":
      return username ? `/profile/${username}` : "/notifications";

    case "liked_post":
    case "reaction":
    case "shared_post":
    case "comment":
    case "comment_reply":
    case "comment_mention":
    case "post_mention":
      return subject_id ? `/post/${subject_id}` : "/notifications";

    case "joined_group":
    case "group_join_request":
    case "group_post_approval":
    case "group_invite":
      return subject_id ? `/groups/${subject_id}` : "/groups";

    case "liked_page":
    case "page_mention":
      return subject_id ? `/pages/${subject_id}` : "/pages";

    case "event_invite":
    case "event_reminder":
      return subject_id ? `/events/${subject_id}` : "/events";

    case "message_reaction":
    case "new_message":
      return subject_id ? `/messages/${subject_id}` : "/messages";

    case "new_order":
    case "order_status":
      return subject_id ? `/orders/${subject_id}` : "/orders";

    case "job_application":
      return subject_id ? `/jobs/${subject_id}` : "/jobs";

    case "memory":
      return "/memories";

    case "live_stream":
      return subject_id ? `/live/${subject_id}` : "/live";

    case "funding_donation":
    case "funding_goal_reached":
      return subject_id ? `/funding/${subject_id}` : "/funding";

    case "pro_expiring":
    case "pro_expired":
      return "/go-pro";

    case "admin_notice":
    case "report":
    default:
      return "/notifications";
  }
}
