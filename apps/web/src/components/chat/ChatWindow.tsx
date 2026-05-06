"use client";

import { useEffect, useRef, useState, useCallback, useMemo, type ElementRef } from "react";
import { useRouter } from "next/navigation";
import { getDirectChatPeer, messagesApi, resolveConversationTitle, storiesApi, contentApi } from "@jungle/api-client";
import type { Message, Conversation, Story } from "@jungle/api-client";
import {
 useRealtimeStore,
 useAuthStore,
 useOnlineUsers,
 useRealtimeEvent,
} from "@jungle/hooks";
import { useAdvancedMediaUpload } from "@/hooks/use-advanced-media-upload";
import {
 Button,
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuRadioGroup,
 DropdownMenuRadioItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
 Input,
 ScrollArea,
 Avatar,
 AvatarImage,
 AvatarFallback,
 Popover,
 PopoverContent,
 PopoverTrigger,
} from "@jungle/ui";
import { toast } from "sonner";
import {
 ArrowLeft,
 Bell,
 BellOff,
 Gift,
 Image as ImageIcon,
 ImageOff,
 Loader2,
 Mic,
 PanelRight,
 Palette,
 Paperclip,
 Phone,
 Reply as ReplyIcon,
 Search,
 Send,
 Smile,
 Square,
 Timer,
 Video,
 X,
} from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { ChatSidebarTabs } from "./ChatSidebarTabs";
import { TypingIndicator } from "./TypingIndicator";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import { GiftPicker } from "./GiftPicker";
import { StickerPicker } from "./StickerPicker";
import { ChatColorPicker } from "./ChatColorPicker";
import { ForwardMessageDialog } from "./ForwardMessageDialog";
import type { Gift as GiftType, Sticker } from "@jungle/api-client";
import { resolveAvatarUrl } from "@/lib/avatar";
import Link from "next/link";
import { useTranslations } from "next-intl";

/** Preset paths served from `public/wallpapers/chat/` (SVG keeps weight tiny). */
const WALLPAPER_PRESETS: Array<{ label: string; url: string | null }> = [
 { label: "None", url: null },
 { label: "Aurora", url: "/wallpapers/chat/aurora.svg" },
 { label: "Mesh", url: "/wallpapers/chat/mesh.svg" },
 { label: "Bokeh", url: "/wallpapers/chat/bokeh.svg" },
 { label: "Paper", url: "/wallpapers/chat/paper.svg" },
];

/** Older builds used .jpg presets that were never in `public`; map to current assets. */
function normalizeWallpaperPath(url: string | null | undefined): string | null {
 if (url == null || url === "") return null;
 const legacy: Record<string, string> = {
 "/wallpapers/chat/aurora.jpg": "/wallpapers/chat/aurora.svg",
 "/wallpapers/chat/mesh.jpg": "/wallpapers/chat/mesh.svg",
 "/wallpapers/chat/bokeh.jpg": "/wallpapers/chat/bokeh.svg",
 "/wallpapers/chat/paper.jpg": "/wallpapers/chat/paper.svg",
 };
 return legacy[url] ?? url;
}

/** Disappearing-messages preset durations in seconds. */
const DESTRUCT_OPTIONS: Array<{ label: string; seconds: number | null }> = [
 { label: "Off", seconds: null },
 { label: "1 hour", seconds: 3600 },
 { label: "24 hours", seconds: 86400 },
 { label: "7 days", seconds: 604800 },
 { label: "30 days", seconds: 2592000 },
];

function formatDestructLabel(seconds: number | null | undefined): string {
 const match = DESTRUCT_OPTIONS.find((o) => o.seconds === (seconds ?? null));
 return match?.label ?? `${seconds}s`;
}

interface ChatWindowProps {
 conversationId: number;
 /**
 * When set, the chat opens with a banner referencing a story. The first
 * message sent is routed through `storiesApi.replyToStory` so the recipient
 * sees a proper story-reply card (PHP parity: `chat-tab.phtml:103`).
 * Plan §3.1 — C9.
 */
 storyReplyId?: number | undefined;
}

function mergeMessagesById(a: Message[], b: Message[]): Message[] {
 const map = new Map<number, Message>();
 for (const m of [...a, ...b]) {
 const id = m.id;
 if (typeof id === "number" && Number.isFinite(id)) map.set(id, m);
 }
 return [...map.values()].sort((x, y) => (x.id ?? 0) - (y.id ?? 0));
}

export function ChatWindow({ conversationId, storyReplyId }: ChatWindowProps) {
 const router = useRouter();
 const tm = useTranslations("messages");
 const tc = useTranslations("common");
 const [conversation, setConversation] = useState<Conversation | null>(null);
 const [messages, setMessages] = useState<Message[]>([]);
 const [content, setContent] = useState("");
 const [searchQuery, setSearchQuery] = useState("");
 const [showSearch, setShowSearch] = useState(false);
 /** Server-backed thread search (/v1/conversations/{id}/search); local filter used while loading or when q differs. */
 const [threadSearchState, setThreadSearchState] = useState<{
 q: string;
 rows: Message[];
 cursor: string | null;
 hasMore: boolean;
 } | null>(null);
 const [threadSearchLoading, setThreadSearchLoading] = useState(false);
 const threadSearchGen = useRef(0);
 const bottomRef = useRef<HTMLDivElement>(null);
 const scrollAreaRef = useRef<ElementRef<typeof ScrollArea>>(null);
 const imageInputRef = useRef<HTMLInputElement>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);
 const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const typingIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const loadOlderLockRef = useRef(false);
 const { typingUsers, registerOpenMessageThread, unregisterOpenMessageThread } =
 useRealtimeStore();
 const { user } = useAuthStore();
 const onlineUsers = useOnlineUsers();
 const { uploadProcessedMedia, isBusy: isUploading } = useAdvancedMediaUpload();
 const [recording, setRecording] = useState(false);
 const [recordingTime, setRecordingTime] = useState(0);
 const mediaRecorderRef = useRef<MediaRecorder | null>(null);
 const audioChunksRef = useRef<Blob[]>([]);
 const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
 const [stickerOpen, setStickerOpen] = useState(false);
 const [giftOpen, setGiftOpen] = useState(false);
 const [showSidebar, setShowSidebar] = useState(false);
 const [chatColor, setChatColor] = useState<string | undefined>(undefined);
 // Chat feature state (plan §3.1 C1, C4, C5, C6, C9).
 const [replyingTo, setReplyingTo] = useState<Message | null>(null);
 const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
 const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null);
 const [destructSeconds, setDestructSeconds] = useState<number | null>(null);
 const [muted, setMuted] = useState(false);
 const [storyToReply, setStoryToReply] = useState<Story | null>(null);
 // C12 — AI smart-reply chips. We refresh suggestions whenever the
 // last message in the thread changes AND the composer is empty, so
 // typing immediately hides the chips. The fetch is debounced with
 // an AbortController to cancel in-flight requests on rapid updates.
 const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
 const [aiLoading, setAiLoading] = useState(false);
 const aiAbortRef = useRef<AbortController | null>(null);
 /** Peer opened the thread (mark_read); shows read receipt on last own message. */
 const [peerAckedRead, setPeerAckedRead] = useState(false);

 const [historyCursor, setHistoryCursor] = useState<string | null>(null);
 const [hasMoreHistory, setHasMoreHistory] = useState(false);
 const [loadingOlder, setLoadingOlder] = useState(false);

 const isTyping = (typingUsers.get(conversationId)?.length ?? 0) > 0;

 const applyMessagesPage = useCallback(
 (r: { data?: Message[]; meta?: { cursor?: string; has_more?: boolean } }) => {
 const list = Array.isArray(r?.data) ? [...r.data].reverse() : [];
 setMessages(list);
 setHistoryCursor(r?.meta?.cursor ?? null);
 setHasMoreHistory(Boolean(r?.meta?.has_more));
 },
 [],
 );

 const flushTypingStop = useCallback(() => {
 if (typingDebounceRef.current) {
 clearTimeout(typingDebounceRef.current);
 typingDebounceRef.current = null;
 }
 if (typingIdleRef.current) {
 clearTimeout(typingIdleRef.current);
 typingIdleRef.current = null;
 }
 void messagesApi.stopTypingIndicator(conversationId).catch((e) => { console.error("[ChatWindow] stopTyping failed", e); });
 }, [conversationId]);

 const scheduleTypingPulse = useCallback(() => {
 if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
 typingDebounceRef.current = setTimeout(() => {
 typingDebounceRef.current = null;
 void messagesApi.sendTypingIndicator(conversationId).catch((e) => { console.error("[ChatWindow] sendTyping failed", e); });
 }, 400);
 if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
 typingIdleRef.current = setTimeout(() => {
 typingIdleRef.current = null;
 flushTypingStop();
 }, 3000);
 }, [conversationId, flushTypingStop]);

 const loadOlderMessages = useCallback(async () => {
 if (!historyCursor || !hasMoreHistory || loadingOlder || loadOlderLockRef.current) return;
 loadOlderLockRef.current = true;
 setLoadingOlder(true);
 const vp = scrollAreaRef.current?.querySelector(
 "[data-radix-scroll-area-viewport]",
 ) as HTMLElement | null | undefined;
 const prevHeight = vp?.scrollHeight ?? 0;
 const prevTop = vp?.scrollTop ?? 0;
 try {
 const r = await messagesApi.getMessages(conversationId, historyCursor);
 const older = Array.isArray(r?.data) ? [...r.data].reverse() : [];
 if (older.length === 0) {
 setHasMoreHistory(false);
 } else {
 setMessages((prev) => [...older, ...prev]);
 setHistoryCursor(r?.meta?.cursor ?? null);
 setHasMoreHistory(Boolean(r?.meta?.has_more));
 requestAnimationFrame(() => {
 const v = scrollAreaRef.current?.querySelector(
 "[data-radix-scroll-area-viewport]",
 ) as HTMLElement | null | undefined;
 if (v) v.scrollTop = v.scrollHeight - prevHeight + prevTop;
 });
 }
 } catch {
	 console.error("[ChatWindow] loadOlderMessages failed");
 } finally {
 setLoadingOlder(false);
 loadOlderLockRef.current = false;
 }
 }, [conversationId, historyCursor, hasMoreHistory, loadingOlder]);

 const onRemoteMessage = useCallback(
 (data: unknown) => {
 const d = data as { conversation_id?: number };
 if (Number(d?.conversation_id) !== conversationId) return;
 void messagesApi.getMessages(conversationId).then(applyMessagesPage);
 },
 [conversationId, applyMessagesPage],
 );

 useRealtimeEvent("message.new", onRemoteMessage);

 const onMessageSeen = useCallback(
 (data: unknown) => {
 const d = data as { conversation_id?: number; user_id?: number };
 if (Number(d?.conversation_id) !== conversationId) return;
 if (d.user_id == null || d.user_id === user?.id) return;
 setPeerAckedRead(true);
 },
 [conversationId, user?.id],
 );
 useRealtimeEvent("message.seen", onMessageSeen);

 useEffect(() => {
 if (!Number.isFinite(conversationId)) return;
 registerOpenMessageThread(conversationId);
 return () => unregisterOpenMessageThread(conversationId);
 }, [conversationId, registerOpenMessageThread, unregisterOpenMessageThread]);

 useEffect(() => {
 setPeerAckedRead(false);
 }, [conversationId]);

 useEffect(() => {
 let cancelled = false;
 let vp: HTMLElement | null = null;
 const onScroll = () => {
 if (vp && vp.scrollTop < 80) void loadOlderMessages();
 };
 const tryAttach = () => {
 if (cancelled) return;
 const root = scrollAreaRef.current;
 const el = root?.querySelector(
 "[data-radix-scroll-area-viewport]",
 ) as HTMLElement | null;
 if (!el) {
 requestAnimationFrame(tryAttach);
 return;
 }
 vp = el;
 el.addEventListener("scroll", onScroll);
 };
 requestAnimationFrame(tryAttach);
 return () => {
 cancelled = true;
 vp?.removeEventListener("scroll", onScroll);
 };
 }, [loadOlderMessages, conversationId]);

 useEffect(() => {
 return () => {
 if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
 if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
 };
 }, []);

 useEffect(() => {
 if (!Number.isFinite(conversationId)) return;
 void messagesApi.markRead(conversationId).catch((e) => { console.error("[ChatWindow] markRead failed", e); });
 messagesApi.getConversation(conversationId)
 .then((c) => {
 setConversation(c);
 setChatColor(c.color);
 setWallpaperUrl(normalizeWallpaperPath(c.wallpaper_url));
 setDestructSeconds(c.destruct_after_seconds ?? null);
 setMuted(c.muted ?? false);
 })
 .catch(() => toast.error("Failed to load conversation"));
 messagesApi.getMessages(conversationId)
 .then((r) => {
 applyMessagesPage(r);
 setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
 })
 .catch(() => toast.error("Failed to load messages"));
 // Reset per-conversation transient state when switching chats.
 setReplyingTo(null);
 setForwardingMessage(null);
 setSearchQuery("");
 setShowSearch(false);
 setThreadSearchState(null);
 setThreadSearchLoading(false);
 threadSearchGen.current += 1;
 }, [conversationId, applyMessagesPage]);

 // C12 — Compute reply suggestions when the last message in the thread
 // is from the OTHER user and the composer is empty. We intentionally
 // skip this on every keystroke to avoid hammering the AI provider.
 useEffect(() => {
 if (content.length > 0) {
 setAiSuggestions([]);
 return;
 }
 if (messages.length === 0) {
 setAiSuggestions([]);
 return;
 }
 const last = messages[messages.length - 1];
 if (!last || last.sender_id === user?.id) {
 setAiSuggestions([]);
 return;
 }
 // Only ever fetch suggestions for plain text messages — stickers,
 // gifts, voice notes etc. don't have meaningful textual context.
 const lastText = (last.content ?? "").trim();
 if (lastText.length === 0) {
 setAiSuggestions([]);
 return;
 }
 aiAbortRef.current?.abort();
 const controller = new AbortController();
 aiAbortRef.current = controller;
 const handle = setTimeout(() => {
 const tail = messages.slice(-6).map((m) => ({
 role: (m.sender_id === user?.id ? "me" : "them") as "me" | "them",
 text: m.content ?? "",
 }));
 setAiLoading(true);
 contentApi
 .aiChatSuggestions({ messages: tail })
 .then((r) => {
 if (controller.signal.aborted) return;
 const list = Array.isArray(r?.suggestions) ? r.suggestions.slice(0, 4) : [];
 setAiSuggestions(list);
 })
 .catch(() => {
 if (!controller.signal.aborted) setAiSuggestions([]);
 })
 .finally(() => {
 if (!controller.signal.aborted) setAiLoading(false);
 });
 }, 600);
 return () => {
 clearTimeout(handle);
 controller.abort();
 };
 }, [messages, content, user?.id]);

 // C9 — Load the referenced story when `storyReplyId` is present.
 useEffect(() => {
 if (!storyReplyId) {
 setStoryToReply(null);
 return;
 }
 storiesApi
 .getStory(storyReplyId)
 .then((s) => setStoryToReply(s))
 .catch(() => {
 toast.error("Failed to load story");
 setStoryToReply(null);
 });
 }, [storyReplyId]);

 // Thread search — GET /v1/conversations/{id}/search (server); local substring filter as fallback while loading or on mismatch.
 useEffect(() => {
 if (!showSearch) {
 setThreadSearchState(null);
 setThreadSearchLoading(false);
 threadSearchGen.current += 1;
 return;
 }
 const q = searchQuery.trim();
 if (!q) {
 setThreadSearchState(null);
 setThreadSearchLoading(false);
 threadSearchGen.current += 1;
 return;
 }
 const myId = ++threadSearchGen.current;
 const handle = setTimeout(() => {
 setThreadSearchLoading(true);
 void messagesApi
 .searchConversationMessages(conversationId, q)
 .then((r) => {
 if (myId !== threadSearchGen.current) return;
 const data = r.data ?? [];
 const asc = [...data].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
 setThreadSearchState({
 q,
 rows: asc,
 cursor: r.meta?.cursor ?? null,
 hasMore: Boolean(r.meta?.has_more),
 });
 })
 .catch(() => {
 if (myId !== threadSearchGen.current) return;
 setThreadSearchState(null);
 toast.error(tm("threadSearchFailed"));
 })
 .finally(() => {
 if (myId !== threadSearchGen.current) return;
 setThreadSearchLoading(false);
 });
 }, 350);

 return () => {
 clearTimeout(handle);
 };
 }, [showSearch, searchQuery, conversationId, tm]);

 const loadMoreThreadSearch = useCallback(async () => {
 const q = searchQuery.trim();
 if (!q) return;
 const snap = threadSearchState;
 if (!snap?.hasMore || !snap.cursor || snap.q !== q) return;
 setThreadSearchLoading(true);
 try {
 const r = await messagesApi.searchConversationMessages(conversationId, q, snap.cursor);
 setThreadSearchState((prev) => {
 if (!prev || prev.q !== q) return prev;
 return {
 q,
 rows: mergeMessagesById(prev.rows, r.data ?? []),
 cursor: r.meta?.cursor ?? null,
 hasMore: Boolean(r.meta?.has_more),
 };
 });
 } catch {
 toast.error(tm("threadSearchFailed"));
 } finally {
 setThreadSearchLoading(false);
 }
 }, [conversationId, searchQuery, threadSearchState, tm]);

 const other = conversation ? getDirectChatPeer(conversation, user?.id) : null;
 const chatTitle = conversation ? resolveConversationTitle(conversation, user?.id) : "Chat";
 const isOtherOnline = other ? onlineUsers.has(Number(other.id)) : false;

 const makeSender = () =>
 user ? { ...user, is_online: true } : { id: 0, uuid: "", username: "", first_name: "You", last_name: "", avatar: "", is_verified: false, is_online: true, is_pro: 0 };

 const handleSend = async () => {
 if (!content.trim()) return;
 flushTypingStop();
 const replyTo = replyingTo;
 const storyRef = storyToReply;
 const optimistic: Message = {
 id: -Date.now(),
 conversation_id: conversationId,
 sender_id: user?.id ?? 0,
 content,
 message_type: "text",
 media: [],
 reply_to: replyTo ?? undefined,
 is_favorited: false,
 is_pinned: false,
 reactions: {},
 created_at: new Date().toISOString(),
 sender: makeSender(),
 };
 setPeerAckedRead(false);
 setMessages((prev) => [...prev, optimistic]);
 const textToSend = content;
 setContent("");
 setReplyingTo(null);
 bottomRef.current?.scrollIntoView({ behavior: "smooth" });

 try {
 if (storyRef) {
 // Route through the story-reply endpoint so the recipient gets a
 // proper "replied to your story" card instead of a plain text message.
 await storiesApi.replyToStory(storyRef.story_media_id, textToSend);
 // Remove `?reply_story=...` from the URL; the story reference is
 // one-shot and shouldn't persist across sends.
 setStoryToReply(null);
 router.replace(`/messages/${conversationId}`);
 // Refetch to surface the newly created message sent by the server.
 const fresh = await messagesApi.getMessages(conversationId);
 applyMessagesPage(fresh);
 } else {
 const sent = await messagesApi.sendMessage(conversationId, {
 content: textToSend,
 type: "text",
 reply_to: replyTo?.id,
 });
 setMessages((prev) => prev.map((m) => m.id === optimistic.id ? sent : m));
 }
 } catch {
 toast.error("Failed to send message");
 setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
 }
 };

 const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 try {
 const media = await uploadProcessedMedia(file);
 if (media) {
 setPeerAckedRead(false);
 const sent = await messagesApi.sendMessage(conversationId, {
 type: file.type.startsWith("video") ? "video" : "image",
 media_id: media.id,
 });
 setMessages((prev) => [...prev, sent]);
 bottomRef.current?.scrollIntoView({ behavior: "smooth" });
 }
 } catch { toast.error("Failed to send media"); }
 e.target.value = "";
 }, [conversationId, uploadProcessedMedia]);

 const handleSendSticker = async (sticker: Sticker) => {
 setStickerOpen(false);
 try {
 setPeerAckedRead(false);
 const sent = await messagesApi.sendMessage(conversationId, { type: "sticker", sticker_id: sticker.id });
 setMessages((prev) => [...prev, sent]);
 bottomRef.current?.scrollIntoView({ behavior: "smooth" });
 } catch { toast.error("Failed to send sticker"); }
 };

 const handleSendGift = async (gift: GiftType) => {
 setGiftOpen(false);
 try {
 setPeerAckedRead(false);
 const sent = await messagesApi.sendMessage(conversationId, { type: "gift", gift_id: gift.id, content: gift.name });
 setMessages((prev) => [...prev, sent]);
 bottomRef.current?.scrollIntoView({ behavior: "smooth" });
 } catch { toast.error("Failed to send gift"); }
 };

 const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 try {
 const media = await uploadProcessedMedia(file);
 if (media) {
 setPeerAckedRead(false);
 const sent = await messagesApi.sendMessage(conversationId, {
 content: file.name,
 type: "file",
 media_id: media.id,
 });
 setMessages((prev) => [...prev, sent]);
 bottomRef.current?.scrollIntoView({ behavior: "smooth" });
 }
 } catch { toast.error("Failed to send file"); }
 e.target.value = "";
 }, [conversationId, uploadProcessedMedia]);

 const startRecording = async () => {
 try {
 const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
 const preferredTypes = [
 "audio/webm;codecs=opus",
 "audio/webm",
 "audio/mp4",
 "audio/ogg;codecs=opus",
 ];
 const mimeType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
 const mediaRecorder = mimeType
 ? new MediaRecorder(stream, { mimeType })
 : new MediaRecorder(stream);
 audioChunksRef.current = [];
 mediaRecorder.ondataavailable = (e) => {
 if (e.data.size > 0) audioChunksRef.current.push(e.data);
 };
 mediaRecorder.onstop = async () => {
 stream.getTracks().forEach((t) => t.stop());
 const blobType = mediaRecorder.mimeType || mimeType || "audio/webm";
 const blob = new Blob(audioChunksRef.current, { type: blobType });
 if (blob.size < 32) {
 toast.error("Recording too short — try again");
 return;
 }
 const ext = blobType.includes("mp4") ? "m4a" : "webm";
 const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: blobType });
 try {
 const media = await uploadProcessedMedia(file);
 if (media) {
 setPeerAckedRead(false);
 const sent = await messagesApi.sendMessage(conversationId, {
 type: "audio",
 media_id: media.id,
 content: "Voice message",
 });
 setMessages((prev) => [...prev, sent]);
 bottomRef.current?.scrollIntoView({ behavior: "smooth" });
 } else {
 toast.error("Voice upload failed");
 }
 } catch {
 toast.error("Failed to send voice message");
 }
 };
 mediaRecorderRef.current = mediaRecorder;
 // Timeslice helps Safari / some engines emit data before `stop`.
 mediaRecorder.start(250);
 setRecording(true);
 setRecordingTime(0);
 recordingTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
 } catch {
 toast.error("Microphone access denied");
 }
 };

 const stopRecording = () => {
 const rec = mediaRecorderRef.current;
 if (rec && rec.state !== "inactive") {
 try {
 rec.requestData?.();
 } catch {
 /* ignore */
 }
 rec.stop();
 }
 setRecording(false);
 if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
 setRecordingTime(0);
 };

 const handleDeleteMessage = async (messageId: number) => {
 try {
 await messagesApi.deleteMessage(messageId);
 setMessages((prev) => prev.filter((m) => m.id !== messageId));
 toast.success("Message deleted");
 } catch { toast.error("Failed to delete"); }
 };

 const handleReactToMessage = async (messageId: number, reaction: string) => {
 try {
 await messagesApi.reactToMessage(messageId, reaction);
 setMessages((prev) => prev.map((m) =>
 m.id === messageId
 ? { ...m, my_reaction: reaction, reactions: { ...m.reactions, [reaction]: (m.reactions[reaction] ?? 0) + 1 } }
 : m
 ));
	} catch { toast.error("Failed to react to message"); }
 };

 // C1 — Reply (server rejects reply_to for optimistic / negative ids)
 const handleReplyTo = (msg: Message) => {
 if (!Number.isFinite(msg.id) || msg.id <= 0) {
 toast.error("Wait until the message is sent before replying to it");
 return;
 }
 setReplyingTo(msg);
 setTimeout(() => document.querySelector<HTMLInputElement>("input[data-chat-input]")?.focus(), 0);
 };

 // C2 — Forward
 const handleStartForward = (msg: Message) => setForwardingMessage(msg);

 // C3 — Pin / Unpin
 const handleTogglePin = async (msg: Message) => {
 try {
 if (msg.is_pinned) {
 await messagesApi.unpinMessage(msg.id);
 } else {
 await messagesApi.pinMessage(msg.id);
 }
 setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_pinned: !msg.is_pinned } : m)));
 toast.success(msg.is_pinned ? "Message unpinned" : "Message pinned");
 } catch {
 toast.error("Failed to update pin");
 }
 };

 // C4 — Wallpaper
 const handleSetWallpaper = async (url: string | null) => {
 const prev = wallpaperUrl;
 setWallpaperUrl(url); // optimistic
 try {
 await messagesApi.updateConversationWallpaper(conversationId, url);
 } catch {
 setWallpaperUrl(prev);
 toast.error("Failed to update wallpaper");
 }
 };

 // C5 — Disappearing messages
 const handleSetDestruct = async (seconds: number | null) => {
 const prev = destructSeconds;
 setDestructSeconds(seconds);
 try {
 await messagesApi.updateConversationDestruct(conversationId, seconds);
 toast.success(seconds === null ? "Disappearing messages disabled" : `Messages disappear after ${formatDestructLabel(seconds)}`);
 } catch {
 setDestructSeconds(prev);
 toast.error("Failed to update disappearing messages");
 }
 };

 // C6 — Mute
 const handleToggleMute = async () => {
 const wasMuted = muted;
 setMuted(!wasMuted); // optimistic
 try {
 if (wasMuted) {
 await messagesApi.unmuteConversation(conversationId);
 } else {
 await messagesApi.muteConversation(conversationId);
 }
 } catch {
 setMuted(wasMuted);
 toast.error("Failed to update mute");
 }
 };

 const filteredMessages = useMemo(() => {
 if (!showSearch) return messages;
 const qRaw = searchQuery.trim();
 if (!qRaw) return messages;
 const q = qRaw.toLowerCase();
 const localFiltered = messages.filter((m) =>
 (m.content ?? "").toLowerCase().includes(q),
 );
 if (threadSearchState && threadSearchState.q === qRaw) {
 return threadSearchState.rows;
 }
 return localFiltered;
 }, [showSearch, searchQuery, messages, threadSearchState]);

 const lastMyMessageId = useMemo(() => {
 const uid = user?.id;
 if (uid == null) return null;
 let max: number | null = null;
 for (const m of messages) {
 if (m.sender_id !== uid || m.id <= 0) continue;
 if (max === null || m.id > max) max = m.id;
 }
 return max;
 }, [messages, user?.id]);

 /** Stable row keys when API sends duplicate/missing ids (avoids React list warnings). */
 const messageRowKeys = useMemo(() => {
 const idCounts = new Map<number, number>();
 return filteredMessages.map((msg, index) => {
 const id = msg.id;
 if (typeof id !== "number" || !Number.isFinite(id)) {
 return `c${conversationId}-idx${index}-${msg.created_at ?? "na"}`;
 }
 const n = (idCounts.get(id) ?? 0) + 1;
 idCounts.set(id, n);
 return n === 1 ? `c${conversationId}-m${id}` : `c${conversationId}-m${id}-d${n}`;
 });
 }, [conversationId, filteredMessages]);

 return (
 <div className="flex h-full">
 <div className="flex h-full min-w-0 flex-1 flex-col">
 {/* Chat header */}
 <div className="h-14 border-b border-border flex items-center px-4 gap-3 shrink-0">
 <Link href="/messages" className="lg:hidden">
 <ArrowLeft className="h-4 w-4" />
 </Link>
 <div className="relative">
 <Avatar className="h-9 w-9">
 <AvatarImage src={resolveAvatarUrl(conversation?.avatar ?? other?.avatar)} />
 <AvatarFallback>{chatTitle[0]}</AvatarFallback>
 </Avatar>
 {isOtherOnline && (
 <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border bg-success" />
 )}
 </div>
 <div className="min-w-0 flex-1">
 <p className="truncate text-[15px] font-semibold">{chatTitle}</p>
 <p className="text-[13px] text-muted-foreground">
 {isOtherOnline ? "Active now" : "Offline"}
 </p>
 </div>
 <div className="flex gap-1">
 <Popover>
 <PopoverTrigger asChild>
 <Button variant="ghost" size="icon" className="h-8 w-8" title="Change chat color">
 <Palette className="h-4 w-4" style={{ color: chatColor }} />
 </Button>
 </PopoverTrigger>
 <PopoverContent side="bottom" className="w-auto p-0">
 <ChatColorPicker
 currentColor={chatColor}
 onSelect={async (color) => {
 setChatColor(color);
 try {
 await messagesApi.updateConversationColor(conversationId, color);
 } catch {
 toast.error("Failed to update chat color");
 }
 }}
 />
 </PopoverContent>
 </Popover>
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8"
 title="Audio call"
 onClick={async () => {
 try {
 const res = await messagesApi.initiateCall(conversationId, "audio");
 router.push(`/call/${res.room_name}?offer=1`);
 } catch {
	 console.error("[ChatWindow] audio call initiation failed");
 // Fallback room naming if call bootstrap endpoint fails.
 router.push(`/call/audio-${conversationId}?offer=1`);
 }
 }}
 >
 <Phone className="h-4 w-4" />
 </Button>
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8"
 title="Video call"
 onClick={async () => {
 try {
 const res = await messagesApi.initiateCall(conversationId, "video");
 router.push(`/call/${res.room_name}?offer=1`);
 } catch {
	 console.error("[ChatWindow] video call initiation failed");
 router.push(`/call/video-${conversationId}?offer=1`);
 }
 }}
 >
 <Video className="h-4 w-4" />
 </Button>
 {/* C6 — Mute toggle */}
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8"
 onClick={handleToggleMute}
 title={muted ? "Unmute notifications" : "Mute notifications"}
 >
 {muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
 </Button>
 {/* C4 — Wallpaper picker */}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="icon" className="h-8 w-8" title="Chat wallpaper">
 {wallpaperUrl ? <ImageIcon className="h-4 w-4" /> : <ImageOff className="h-4 w-4" />}
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-48">
 <DropdownMenuLabel>Chat wallpaper</DropdownMenuLabel>
 <DropdownMenuSeparator />
 {WALLPAPER_PRESETS.map((preset) => (
 <DropdownMenuItem
 key={preset.label}
 onSelect={() => handleSetWallpaper(preset.url)}
 className={wallpaperUrl === preset.url ? "bg-muted" : ""}
 >
 {preset.label}
 </DropdownMenuItem>
 ))}
 </DropdownMenuContent>
 </DropdownMenu>
 {/* C5 — Disappearing messages */}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="ghost"
 size="icon"
 className={`h-8 w-8 ${destructSeconds ? "text-primary" : ""}`}
 title={destructSeconds ? `Disappearing: ${formatDestructLabel(destructSeconds)}` : "Disappearing messages"}
 >
 <Timer className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-48">
 <DropdownMenuLabel>Disappearing messages</DropdownMenuLabel>
 <DropdownMenuSeparator />
 <DropdownMenuRadioGroup
 value={destructSeconds === null ? "off" : String(destructSeconds)}
 onValueChange={(v) => handleSetDestruct(v === "off" ? null : Number(v))}
 >
 {DESTRUCT_OPTIONS.map((opt) => (
 <DropdownMenuRadioItem
 key={opt.label}
 value={opt.seconds === null ? "off" : String(opt.seconds)}
 >
 {opt.label}
 </DropdownMenuRadioItem>
 ))}
 </DropdownMenuRadioGroup>
 </DropdownMenuContent>
 </DropdownMenu>
 <Button
 variant={showSidebar ? "secondary" : "ghost"}
 size="icon"
 className="h-8 w-8 hidden md:inline-flex"
 onClick={() => setShowSidebar((v) => !v)}
 title="Conversation info"
 >
 <PanelRight className="h-4 w-4" />
 </Button>
 </div>
 </div>

 {/* Search bar — thread-scoped server search (F4); local fallback while loading */}
 {showSearch && (
 <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
 <Input
 data-testid="thread-search-input"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder={tm("search")}
 className="h-8 flex-1 text-sm"
 autoFocus
 aria-busy={threadSearchLoading}
 />
 {threadSearchLoading && (
 <>
 <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
 <span className="sr-only">{tm("threadSearchSearching")}</span>
 </>
 )}
 </div>
 )}

 <ScrollArea
 ref={scrollAreaRef}
 className="flex-1 p-4"
 style={
 wallpaperUrl
 ? {
 backgroundImage: `url(${wallpaperUrl})`,
 backgroundSize: "cover",
 backgroundPosition: "center",
 backgroundRepeat: "no-repeat",
 }
 : undefined
 }
 >
 {loadingOlder && (
 <p className="mb-2 text-center text-xs font-semibold text-muted-foreground">
 Loading older messages…
 </p>
 )}
 {showSearch &&
 !!searchQuery.trim() &&
 !threadSearchLoading &&
 filteredMessages.length === 0 && (
 <p className="mb-4 text-center text-sm text-muted-foreground">{tm("noThreadSearchResults")}</p>
 )}
 {showSearch &&
 threadSearchState &&
 threadSearchState.q === searchQuery.trim() &&
 threadSearchState.hasMore && (
 <div className="mb-4 flex justify-center">
 <Button
 type="button"
 variant="outline"
 size="sm"
 disabled={threadSearchLoading}
 onClick={() => void loadMoreThreadSearch()}
 >
 {threadSearchLoading ? (
 <>
 <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
 {tm("threadSearchSearching")}
 </>
 ) : (
 tc("loadMore")
 )}
 </Button>
 </div>
 )}
 {filteredMessages.map((msg, i) => (
 <MessageBubble
 key={messageRowKeys[i]}
 message={msg}
 onDelete={handleDeleteMessage}
 onReact={handleReactToMessage}
 onReply={handleReplyTo}
 onForward={handleStartForward}
 onTogglePin={handleTogglePin}
 showSeenReceipt={
 peerAckedRead &&
 lastMyMessageId != null &&
 msg.id === lastMyMessageId &&
 msg.sender_id === user?.id
 }
 color={chatColor}
 />
 ))}
 {isTyping && <TypingIndicator />}
 <div ref={bottomRef} />
 </ScrollArea>

 <div className="space-y-1 border-t border-border bg-background p-3">
 {/* C9 — Story reply banner (thumbnail + author) */}
 {storyToReply && (
 <div className="flex items-start gap-2 border bg-primary/10 px-3 py-2">
 <div className="h-10 w-10 shrink-0 overflow-hidden border bg-muted">
 {storyToReply.media.type === "video" && storyToReply.media.thumbnail ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={storyToReply.media.thumbnail}
 alt="Story thumbnail"
 className="h-full w-full object-cover"
 />
 ) : (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={storyToReply.media.url}
 alt="Story thumbnail"
 className="h-full w-full object-cover"
 />
 )}
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-xs font-semibold text-primary">
 Replying to {storyToReply.publisher.first_name}&apos;s story
 </p>
 {storyToReply.text ? (
 <p className="truncate text-xs text-muted-foreground">{storyToReply.text}</p>
 ) : (
 <p className="text-xs text-muted-foreground italic">{storyToReply.media.type}</p>
 )}
 </div>
 <Button
 variant="ghost"
 size="icon"
 className="h-6 w-6 shrink-0"
 onClick={() => {
 setStoryToReply(null);
 router.replace(`/messages/${conversationId}`);
 }}
 title="Cancel story reply"
 >
 <X className="h-3.5 w-3.5" />
 </Button>
 </div>
 )}
 {/* C1 — Reply banner */}
 {replyingTo && (
 <div className="flex items-start gap-2 border border-l-[6px] border-l-primary bg-secondary/50 px-3 py-2">
 <ReplyIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
 <div className="min-w-0 flex-1">
 <p className="text-xs font-semibold text-primary">
 Replying to {replyingTo.sender?.first_name ?? "message"}
 </p>
 <p className="truncate text-xs text-muted-foreground">
 {replyingTo.message_type === "text"
 ? replyingTo.content
 : `[${replyingTo.message_type}]${replyingTo.content ? ` ${replyingTo.content}` : ""}`}
 </p>
 </div>
 <Button
 variant="ghost"
 size="icon"
 className="h-6 w-6 shrink-0"
 onClick={() => setReplyingTo(null)}
 title="Cancel reply"
 >
 <X className="h-3.5 w-3.5" />
 </Button>
 </div>
 )}
 {aiSuggestions.length > 0 && content.length === 0 && (
 <div
 className="mb-1.5 flex flex-wrap gap-1.5"
 data-testid="ai-chat-suggestions"
 >
 {aiSuggestions.map((s, i) => (
 <button
 key={i}
 type="button"
 onClick={() => {
 setContent(s);
 setAiSuggestions([]);
 setTimeout(
 () =>
 document
 .querySelector<HTMLInputElement>("input[data-chat-input]")
 ?.focus(),
 0,
 );
 }}
 className="rounded-full bg-muted/40 px-3 py-1 text-[13px] font-medium transition-colors hover:bg-muted disabled:opacity-50"
 disabled={aiLoading}
 title="AI suggested reply"
 >
 {s}
 </button>
 ))}
 </div>
 )}
 <input ref={imageInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleImageUpload} />
 <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.zip,.rar,.txt,.xls,.xlsx" className="hidden" onChange={handleFileUpload} />
 <div className="flex gap-1.5 items-center">
 <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => imageInputRef.current?.click()} disabled={isUploading} title="Send image/video">
 <ImageIcon className="h-4 w-4" />
 </Button>
 <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => fileInputRef.current?.click()} disabled={isUploading} title="Attach file">
 <Paperclip className="h-4 w-4" />
 </Button>
 <EmojiPicker
 onEmojiSelect={(emoji) => setContent((prev) => prev + emoji)}
 triggerClassName="h-8 w-8 p-0"
 />
 <Popover open={stickerOpen} onOpenChange={setStickerOpen}>
 <PopoverTrigger asChild>
 <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" title="Stickers">
 <Smile className="h-4 w-4" />
 </Button>
 </PopoverTrigger>
 <PopoverContent side="top" className="w-64 p-0">
 <StickerPicker onSelect={handleSendSticker} />
 </PopoverContent>
 </Popover>
 <Popover open={giftOpen} onOpenChange={setGiftOpen}>
 <PopoverTrigger asChild>
 <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" title="Send gift">
 <Gift className="h-4 w-4" />
 </Button>
 </PopoverTrigger>
 <PopoverContent side="top" className="w-56 p-0">
 <GiftPicker onSelect={handleSendGift} />
 </PopoverContent>
 </Popover>
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8 shrink-0"
 data-testid="chat-thread-search-toggle"
 onClick={() => setShowSearch(!showSearch)}
 title={tm("search")}
 >
 <Search className="h-4 w-4" />
 </Button>
 <Input
 data-chat-input
 value={content}
 onChange={(e) => {
 setContent(e.target.value);
 scheduleTypingPulse();
 }}
 onBlur={() => flushTypingStop()}
 onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
 placeholder={replyingTo ? "Write a reply…" : "Type a message…"}
 className="flex-1 h-8 text-sm"
 disabled={isUploading}
 />
 <Button
 variant={recording ? "destructive" : "ghost"}
 size="icon"
 className="h-8 w-8 shrink-0"
 onClick={recording ? stopRecording : startRecording}
 disabled={isUploading}
 title={recording ? "Stop recording" : "Voice message"}
 >
 {recording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4" />}
 </Button>
 {recording && (
 <span className="text-xs text-destructive font-mono animate-pulse">
 {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
 </span>
 )}
 <Button onClick={handleSend} disabled={!content.trim() || isUploading} size="icon" className="h-8 w-8 shrink-0">
 <Send className="h-4 w-4" />
 </Button>
 </div>
 </div>
 </div>

 {showSidebar && (
 <div className="hidden h-full w-[320px] shrink-0 border-l border-border md:flex">
 <ChatSidebarTabs conversationId={conversationId} />
 </div>
 )}

 {/* C2 — Forward dialog (mounts outside the header to avoid z-index fights) */}
 <ForwardMessageDialog
 open={!!forwardingMessage}
 message={forwardingMessage}
 onClose={() => setForwardingMessage(null)}
 />
 </div>
 );
}
