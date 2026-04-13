export const OAUTH_PROVIDERS = [
  "google",
  "facebook",
  "twitter",
  "apple",
  "linkedin",
  "discord",
  "tiktok",
  "instagram",
  "vkontakte",
  "qq",
  "wechat",
  "mailru",
  "okru",
  "wordpress",
] as const;

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export const PAYMENT_GATEWAYS = [
  "stripe",
  "paypal",
  "paystack",
  "coinbase",
  "flutterwave",
  "razorpay",
  "iyzipay",
  "cashfree",
  "yoomoney",
  "aamarpay",
  "fortumo",
  "2checkout",
  "coinpayments",
  "bank_transfer",
  "braintree",
  "payfast",
  "paysera",
  "securionpay",
  "ngenius",
  "paypro_bitcoin",
] as const;

export type PaymentGatewayId = (typeof PAYMENT_GATEWAYS)[number];

export const FEED_THRESHOLD_PX = 200;
export const DEBOUNCE_SEARCH_MS = 300;
export const TYPING_STOP_DELAY_MS = 3000;
export const WS_MAX_BACKOFF_MS = 30_000;
export const WS_INITIAL_BACKOFF_MS = 1_000;
export const MAX_POST_IMAGES = 10;
export const MAX_POLL_OPTIONS = 6;
export const MIN_POLL_OPTIONS = 2;
export const MAX_VIDEO_DURATION_S = 300;
export const MAX_VIDEO_SIZE_MB = 100;

export const POST_PRIVACY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "friends", label: "Friends" },
  { value: "only_me", label: "Only Me" },
] as const;

export const NOTIFICATION_TYPES = [
  "following",
  "follow_accepted",
  "liked_post",
  "reaction",
  "shared_post",
  "comment",
  "comment_reply",
  "comment_mention",
  "post_mention",
  "joined_group",
  "group_join_request",
  "group_post_approval",
  "group_invite",
  "liked_page",
  "page_mention",
  "event_invite",
  "event_reminder",
  "message_reaction",
  "new_order",
  "order_status",
  "job_application",
  "report",
  "pro_expiring",
  "pro_expired",
  "admin_notice",
  "memory",
  "story_reply",
  "birthday",
  "live_stream",
  "funding_donation",
  "funding_goal_reached",
] as const;
