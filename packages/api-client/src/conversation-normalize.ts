import type { Conversation, ConversationMember, Message } from "./types/message";
import type { PublicUser } from "./types/user";
import type { PaginatedResponse } from "./types/pagination";

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
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

/** Builds {@link PublicUser} from flat API fields (`user_id` or `id`, `username`, …). */
export function publicUserFromFlat(m: Record<string, unknown>): PublicUser {
  const idRaw = m["user_id"] ?? m["id"];
  const id = Number(idRaw);
  return {
    id: Number.isFinite(id) ? id : 0,
    uuid: typeof m["uuid"] === "string" ? m["uuid"] : "",
    username: typeof m["username"] === "string" ? m["username"] : String(m["username"] ?? ""),
    first_name: typeof m["first_name"] === "string" ? m["first_name"] : String(m["first_name"] ?? ""),
    last_name: typeof m["last_name"] === "string" ? m["last_name"] : String(m["last_name"] ?? ""),
    avatar: typeof m["avatar"] === "string" ? m["avatar"] : String(m["avatar"] ?? ""),
    is_verified: Boolean(m["is_verified"]),
    is_online: Boolean(m["is_online"]),
    is_pro: Number(m["is_pro"] ?? 0),
  };
}

export function normalizeConversationMember(m: unknown): ConversationMember {
  if (!isRecord(m)) {
    return {
      user: {
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
      role: "member",
      joined_at: "",
    };
  }

  const nested = m["user"];
  let user: PublicUser;
  if (isRecord(nested)) {
    user = publicUserFromFlat({ ...m, ...nested, user_id: nested["id"] ?? m["user_id"] });
  } else if (m["user_id"] != null || m["id"] != null) {
    user = publicUserFromFlat(m);
  } else {
    user = {
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

  const roleRaw = m["role"];
  const role: ConversationMember["role"] = roleRaw === "admin" ? "admin" : "member";
  const joined = m["joined_at"];
  const joined_at =
    typeof joined === "string" ? joined : joined != null ? String(joined) : "";

  return { user, role, joined_at };
}

function normalizeLastMessage(raw: unknown): Message | undefined {
  if (!isRecord(raw)) return undefined;
  const id = Number(raw["id"]);
  if (!Number.isFinite(id)) return undefined;
  const senderId = Number(raw["sender_id"] ?? 0);
  const sender: PublicUser = {
    id: Number.isFinite(senderId) ? senderId : 0,
    uuid: "",
    username: "",
    first_name: "",
    last_name: "",
    avatar: "",
    is_verified: false,
    is_online: false,
    is_pro: 0,
  };
  const created =
    typeof raw["created_at"] === "string"
      ? raw["created_at"]
      : raw["created_at"] != null
        ? String(raw["created_at"])
        : "";
  return {
    id,
    conversation_id: Number(raw["conversation_id"] ?? 0),
    sender_id: Number.isFinite(senderId) ? senderId : 0,
    content: String(raw["content"] ?? ""),
    message_type: normalizeMessageType(raw["message_type"]),
    media: [],
    is_favorited: false,
    is_pinned: false,
    reactions: {},
    created_at: created,
    sender,
  };
}

/**
 * Messaging-service returns `members` as flat rows (`user_id`, `username`, …).
 * The web app expects `ConversationMember.user` (PublicUser). This bridges both shapes.
 */
export function normalizeConversation(raw: unknown): Conversation {
  if (!isRecord(raw)) {
    return {
      id: 0,
      type: "direct",
      last_message_at: "",
      unread_count: 0,
      muted: false,
      pinned: false,
      archived: false,
      members: [],
    };
  }

  const membersRaw = raw["members"];
  const members: ConversationMember[] = Array.isArray(membersRaw)
    ? membersRaw.map(normalizeConversationMember)
    : [];

  const id = Number(raw["id"]);
  const typeRaw = raw["type"];
  const unreadRaw = Number(raw["unread_count"] ?? 0);

  const lastAt = raw["last_message_at"];
  const last_message_at =
    typeof lastAt === "string" ? lastAt : lastAt != null ? String(lastAt) : "";

  const mutedUntil = raw["muted_until"];
  const muted_until =
    mutedUntil === null || mutedUntil === undefined
      ? null
      : typeof mutedUntil === "string"
        ? mutedUntil
        : String(mutedUntil);

  const conv: Conversation = {
    id: Number.isFinite(id) ? id : 0,
    type: typeRaw === "group" ? "group" : "direct",
    last_message_at,
    unread_count: Number.isFinite(unreadRaw) ? unreadRaw : 0,
    muted: Boolean(raw["muted"]),
    muted_until,
    pinned: Boolean(raw["pinned"]),
    archived: Boolean(raw["archived"]),
    members,
  };
  const lastMsg = normalizeLastMessage(raw["last_message"]);
  if (lastMsg !== undefined) conv.last_message = lastMsg;
  if (typeof raw["name"] === "string") conv.name = raw["name"];
  if (typeof raw["avatar"] === "string") conv.avatar = raw["avatar"];
  if (raw["wallpaper_url"] === null) conv.wallpaper_url = null;
  else if (typeof raw["wallpaper_url"] === "string") conv.wallpaper_url = raw["wallpaper_url"];
  if (raw["destruct_after_seconds"] === null) conv.destruct_after_seconds = null;
  else if (typeof raw["destruct_after_seconds"] === "number") conv.destruct_after_seconds = raw["destruct_after_seconds"];
  else if (raw["destruct_after_seconds"] != null) conv.destruct_after_seconds = Number(raw["destruct_after_seconds"]);
  if (typeof raw["color"] === "string") conv.color = raw["color"];
  return conv;
}

export function getDirectChatPeer(
  conv: Pick<Conversation, "type" | "members">,
  currentUserId: number | string | null | undefined,
): PublicUser | null {
  if (conv.type !== "direct") return null;
  const uid =
    currentUserId != null && currentUserId !== ""
      ? Number(currentUserId)
      : null;
  for (const m of conv.members) {
    const u = m.user;
    if (!u || !Number.isFinite(Number(u.id))) continue;
    if (uid == null || Number.isNaN(uid) || Number(u.id) !== uid) return u;
  }
  return conv.members[0]?.user ?? null;
}

export function formatPeerDisplayName(peer: PublicUser | null): string {
  if (!peer) return "";
  const full = [peer.first_name, peer.last_name]
    .map((x) => (x != null ? String(x).trim() : ""))
    .filter(Boolean)
    .join(" ")
    .trim();
  if (full) return full;
  const u = peer.username?.trim();
  if (u) return u.startsWith("@") ? u : `@${u}`;
  return "";
}

/**
 * Header / list title for a conversation (group name or other participant).
 */
export function resolveConversationTitle(
  conv: Pick<Conversation, "type" | "name" | "members">,
  currentUserId: number | string | null | undefined,
): string {
  if (conv.type === "group") return conv.name?.trim() || "Group";
  const peer = getDirectChatPeer(conv as Conversation, currentUserId);
  const named = formatPeerDisplayName(peer);
  if (named) return named;
  const fallbackName = conv.name?.trim();
  if (fallbackName) return fallbackName;
  return "Chat";
}

/**
 * Some list endpoints return a paginated envelope; others unwrap to a bare array
 * (e.g. pinned). Accept either after `api.get` unwrapping.
 */
export function normalizeConversationPage(raw: unknown): PaginatedResponse<Conversation> {
  if (Array.isArray(raw)) {
    return { data: raw.map((c) => normalizeConversation(c)), meta: { has_more: false } };
  }
  const r = raw as PaginatedResponse<unknown>;
  const data = Array.isArray(r?.data) ? r.data.map((c) => normalizeConversation(c)) : [];
  return {
    data,
    meta: r?.meta ?? { has_more: false },
  };
}
