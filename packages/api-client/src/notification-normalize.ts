import type { Notification, NotificationType, PaginatedResponse, PublicUser } from "./types/index";

/** Result of {@link normalizeNotificationPage} — always has `meta` suitable for paging cursors. */
export type NotificationPageNormalized = PaginatedResponse<Notification>;

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function actorFromSender(s: unknown): PublicUser {
  if (!isRecord(s)) {
    return {
      id: 0,
      uuid: "",
      username: "",
      first_name: "",
      last_name: "",
      avatar: "",
      is_verified: false,
      is_online: false,
      is_pro: 0,
    };
  }
  return {
    id: Number(s.id) || 0,
    uuid: String(s.uuid ?? ""),
    username: String(s.username ?? ""),
    first_name: String(s.first_name ?? ""),
    last_name: String(s.last_name ?? ""),
    avatar: String(s.avatar ?? ""),
    is_verified: Boolean(s.is_verified),
    is_online: Boolean(s.is_online),
    is_pro: Number(s.is_pro ?? 0),
  };
}

/** Maps API notification rows to the web `Notification` shape (`actor`, `message`, `subject_id`). */
export function normalizeNotificationRow(row: unknown): Notification {
  const r = isRecord(row) ? row : {};
  const subjectIdRaw = r.subject_id ?? r.target_id;
  const subjectTypeRaw = r.subject_type ?? r.target_type;
  const senderPayload = r.sender ?? r.actor ?? r.user ?? r.from_user;
  return {
    id: Number(r.id) || 0,
    type: String(r.type ?? "admin_notice") as NotificationType,
    actor: actorFromSender(senderPayload),
    ...(subjectIdRaw !== undefined && subjectIdRaw !== null
      ? { subject_id: Number(subjectIdRaw) }
      : {}),
    ...(typeof subjectTypeRaw === "string" ? { subject_type: subjectTypeRaw } : {}),
    message: String(r.message ?? r.text ?? ""),
    is_read: Boolean(r.is_read),
    created_at: String(r.created_at ?? new Date().toISOString()),
  };
}

export function normalizeNotificationPage(raw: unknown): NotificationPageNormalized {
  const r = isRecord(raw) ? raw : {};
  const data = Array.isArray(r.data) ? r.data.map(normalizeNotificationRow) : [];
  const meta = isRecord(r.meta) ? r.meta : {};
  return {
    data,
    meta: {
      has_more: Boolean(meta.has_more),
      ...(meta.cursor != null ? { cursor: String(meta.cursor) } : {}),
    },
  };
}
