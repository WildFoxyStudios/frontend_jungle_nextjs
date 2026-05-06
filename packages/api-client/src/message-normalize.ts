import { publicUserFromFlat } from "./conversation-normalize";
import type { Gift, Message } from "./types/message";
import type { MediaItem } from "./types/post";
import type { PublicUser } from "./types/user";
import type { PaginatedResponse } from "./types/pagination";

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** API / serde may omit or stringify timestamps oddly; never pass garbage to `new Date()`. */
function coerceCreatedAt(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const ms = raw < 1e12 ? raw * 1000 : raw;
    const d = new Date(ms);
    return Number.isFinite(d.getTime()) ? d.toISOString() : "";
  }
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return "";
    const t = Date.parse(s);
    if (Number.isFinite(t)) return new Date(t).toISOString();
    return "";
  }
  if (isRecord(raw)) {
    const sec = raw["seconds"];
    const nanos = raw["nanoseconds"];
    if (typeof sec === "number" && Number.isFinite(sec)) {
      const ms = sec * 1000 + (typeof nanos === "number" ? Math.floor(nanos / 1e6) : 0);
      const d = new Date(ms);
      return Number.isFinite(d.getTime()) ? d.toISOString() : "";
    }
  }
  return "";
}

function normalizeMessageType(raw: unknown): Message["message_type"] {
  const s = typeof raw === "string" ? raw : "text";
  const allowed: Message["message_type"][] = [
    "text",
    "image",
    "video",
    "audio",
    "sticker",
    "gift",
    "file",
    "call",
  ];
  return (allowed as readonly string[]).includes(s) ? (s as Message["message_type"]) : "text";
}

function parseMedia(raw: unknown): MediaItem[] {
  if (Array.isArray(raw)) return raw as MediaItem[];
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw) as unknown;
      if (Array.isArray(p)) return p as MediaItem[];
    } catch {
      /* ignore */
    }
  }
  return [];
}

function senderFromRow(row: Record<string, unknown>): PublicUser {
  const nested = row["sender"];
  if (isRecord(nested)) {
    return publicUserFromFlat({ ...row, ...nested, user_id: nested["id"] ?? row["sender_id"] });
  }
  return publicUserFromFlat({
    user_id: row["sender_id"],
    username: row["sender_username"] ?? row["username"],
    first_name: row["sender_first_name"] ?? row["first_name"],
    last_name: row["sender_last_name"] ?? row["last_name"],
    avatar: row["sender_avatar"] ?? row["avatar"],
    is_verified: row["is_verified"],
    is_online: row["is_online"],
    is_pro: row["is_pro"],
  });
}

function normalizeReplyPreview(r: Record<string, unknown>): Message {
  const id = Number(r["id"]);
  const senderId = Number(r["sender_id"] ?? 0);
  const un = String(r["sender_username"] ?? "").trim();
  const sender: PublicUser = {
    id: Number.isFinite(senderId) ? senderId : 0,
    uuid: "",
    username: un,
    first_name: un || "User",
    last_name: "",
    avatar: "",
    is_verified: false,
    is_online: false,
    is_pro: 0,
  };
  const created = coerceCreatedAt(r["created_at"]);
  return {
    id: Number.isFinite(id) ? id : 0,
    conversation_id: Number(r["conversation_id"] ?? 0),
    sender_id: Number.isFinite(senderId) ? senderId : 0,
    content: String(r["content"] ?? ""),
    message_type: normalizeMessageType(r["message_type"]),
    media: [],
    is_favorited: false,
    is_pinned: false,
    reactions: {},
    created_at: created,
    sender,
  };
}

/**
 * One message row as returned by messaging-service (`MessageWithSender` or already-client-shaped).
 */
export function normalizeMessageRow(row: unknown): Message {
  if (!isRecord(row)) {
    return {
      id: 0,
      conversation_id: 0,
      sender_id: 0,
      content: "",
      message_type: "text",
      media: [],
      is_favorited: false,
      is_pinned: false,
      reactions: {},
      created_at: "",
      sender: {
        id: 0,
        uuid: "",
        username: "",
        first_name: "",
        last_name: "",
        avatar: "",
        is_verified: false,
        is_online: false,
        is_pro: 0,
      },
    };
  }

  const id = Number(row["id"]);
  const reactionsRaw = row["reactions"];
  const created = coerceCreatedAt(row["created_at"]);

  const fwd = row["forwarded_from"];
  const out: Message = {
    id: Number.isFinite(id) ? id : 0,
    conversation_id: Number(row["conversation_id"] ?? 0),
    sender_id: Number(row["sender_id"] ?? 0),
    content: String(row["content"] ?? ""),
    message_type: normalizeMessageType(row["message_type"]),
    media: parseMedia(row["media"]),
    forwarded_from: fwd === null || fwd === undefined ? null : Number(fwd),
    is_favorited: Boolean(row["is_favorited"]),
    is_pinned: Boolean(row["is_pinned"]),
    reactions: isRecord(reactionsRaw) ? (reactionsRaw as Record<string, number>) : {},
    created_at: created,
    sender: senderFromRow(row),
  };
  if (typeof row["sticker_url"] === "string") out.sticker_url = row["sticker_url"];
  if (isRecord(row["gift"])) out.gift = row["gift"] as unknown as Gift;
  if (isRecord(row["reply_to"])) out.reply_to = normalizeMessageRow(row["reply_to"]);
  if (typeof row["my_reaction"] === "string") out.my_reaction = row["my_reaction"];

  // Gift payloads often store metadata only in `media` JSON from messaging-service.
  if (out.message_type === "gift" && !out.gift && out.media.length > 0) {
    const first = out.media[0] as unknown as Record<string, unknown>;
    const gid = Number(first["gift_id"]);
    out.gift = {
      id: Number.isFinite(gid) ? gid : 0,
      name: String(first["name"] ?? out.content ?? "Gift"),
      image: String(first["url"] ?? ""),
      price: Number(first["price"] ?? 0),
      currency: String(first["currency"] ?? "USD"),
    };
  }

  return out;
}

/**
 * List endpoint returns `{ message: MessageWithSender, reply_to?: ReplyPreview }[]`.
 */
export function normalizeListMessageEnvelope(item: unknown): Message {
  if (!isRecord(item)) return normalizeMessageRow(item);
  const msg = item["message"];
  if (isRecord(msg)) {
    const base = normalizeMessageRow(msg);
    const reply = item["reply_to"];
    if (isRecord(reply)) {
      base.reply_to = normalizeReplyPreview(reply);
    }
    return base;
  }
  return normalizeMessageRow(item);
}

export function normalizeMessagePage(raw: unknown): PaginatedResponse<Message> {
  if (Array.isArray(raw)) {
    return { data: raw.map((x) => normalizeListMessageEnvelope(x)), meta: { has_more: false } };
  }
  const r = raw as PaginatedResponse<unknown>;
  const data = Array.isArray(r?.data) ? r.data.map((x) => normalizeListMessageEnvelope(x)) : [];
  return { data, meta: r?.meta ?? { has_more: false } };
}

/** POST /messages returns `MessageWithSender` or the same `{ message, reply_to }` envelope as list. */
export function normalizeSentMessagePayload(raw: unknown): Message {
  if (isRecord(raw) && isRecord(raw["message"])) {
    return normalizeListMessageEnvelope(raw);
  }
  return normalizeMessageRow(raw);
}
