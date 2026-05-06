"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDirectChatPeer, messagesApi, resolveConversationTitle } from "@jungle/api-client";
import type { Conversation } from "@jungle/api-client";
import { useAuthStore, useRealtimeEvent, useRealtimeStore } from "@jungle/hooks";
import {
 Avatar,
 AvatarFallback,
 AvatarImage,
 Badge,
 Button,
 Popover,
 PopoverContent,
 PopoverTrigger,
 ScrollArea,
 Tabs,
 TabsContent,
 TabsList,
 TabsTrigger,
} from "@jungle/ui";
import { Check, Loader2, MessageCircle, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { resolveAvatarUrl } from "@/lib/avatar";
import { formatDistanceToNow } from "@/lib/date";

type TabKey = "direct" | "group";

/**
 * Renders a conversation preview row.
 *
 * For direct chats we surface the other participant's avatar and name; for
 * group chats we keep the group avatar/name. The last message snippet is
 * truncated and annotated with the reply type ("Photo", "Sticker", …) when
 * the content is not plain text.
 */
function ConversationRow({
 conversation,
 currentUserId,
 onNavigate,
}: {
 conversation: Conversation;
 currentUserId: number | null;
 onNavigate: () => void;
}) {
 const last = conversation.last_message;
 const isUnread = conversation.unread_count > 0;

 const { displayName, displayAvatar, fallback } = useMemo(() => {
 if (conversation.type === "group") {
 return {
 displayName: conversation.name ?? "Group",
 displayAvatar: conversation.avatar,
 fallback: (conversation.name ?? "G").charAt(0),
 };
 }
 const peer = getDirectChatPeer(conversation, currentUserId);
 const title = resolveConversationTitle(conversation, currentUserId);
 return {
 displayName: title,
 displayAvatar: conversation.avatar ?? peer?.avatar,
 fallback: (title.trim().charAt(0) || "?").toUpperCase(),
 };
 }, [conversation, currentUserId]);

 // Build a human-readable snippet respecting the message type.
 const snippet = useMemo(() => {
 if (!last) return "";
 switch (last.message_type) {
 case "image":
 return "📷 Photo";
 case "video":
 return "🎬 Video";
 case "audio":
 return "🎙 Voice note";
 case "sticker":
 return "💟 Sticker";
 case "gift":
 return "🎁 Gift";
 case "file":
 return "📎 File";
 case "call":
 return "📞 Call";
 default:
 return last.content || "";
 }
 }, [last]);

 return (
 <Link
 href={`/messages/${conversation.id}`}
 onClick={onNavigate}
 className={`flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-secondary/60 ${
 isUnread ? "bg-primary/5" : ""
 }`}
 >
 <Avatar className="h-10 w-10 shrink-0">
 <AvatarImage src={resolveAvatarUrl(displayAvatar)} />
 <AvatarFallback>{fallback}</AvatarFallback>
 </Avatar>
 <div className="min-w-0 flex-1">
 <div className="flex items-center justify-between gap-2">
 <p
 className={`truncate text-sm ${
 isUnread ? "font-semibold" : "font-medium"
 }`}
 >
 {displayName}
 </p>
 <span className="shrink-0 text-[10px] text-muted-foreground">
 {formatDistanceToNow(conversation.last_message_at)}
 </span>
 </div>
 <div className="flex items-center justify-between gap-2">
 <p
 className={`truncate text-xs ${
 isUnread ? "text-foreground" : "text-muted-foreground"
 }`}
 >
 {snippet}
 </p>
 {isUnread && (
 <Badge
 variant="destructive"
 className="h-4 min-w-[1rem] px-1 text-[10px]"
 >
 {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
 </Badge>
 )}
 </div>
 </div>
 </Link>
 );
}

/**
 * Header messages preview — mirrors `header/messages.phtml` and
 * `header/group_messages.phtml` from the PHP theme.
 *
 * Two tabs reflect the backend's supported conversation types:
 * direct (1:1) and group. A "Page" tab was intentionally omitted because the
 * Rust messaging service doesn't model page conversations yet; the plan
 * foresees adding it later alongside backend support.
 */
export function MessagesDropdown() {
 const { user } = useAuthStore();
 const { unreadMessages } = useRealtimeStore();
 const [open, setOpen] = useState(false);
 const [tab, setTab] = useState<TabKey>("direct");
 const tc = useTranslations("common");
 const tn = useTranslations("nav");
 const tm = useTranslations("messages");

 const [conversations, setConversations] = useState<Conversation[]>([]);
 const [loading, setLoading] = useState(false);
 const openRef = useRef(false);

 const loadConversations = useCallback(async () => {
 setLoading(true);
 try {
 const r = await messagesApi.getConversations();
 setConversations(Array.isArray(r?.data) ? r.data : []);
 } catch {
 /* non-critical */
 } finally {
 setLoading(false);
 }
 }, []);

 useEffect(() => {
 openRef.current = open;
 if (open) void loadConversations();
 }, [open, loadConversations]);

 const refreshIfOpen = useCallback(() => {
 if (openRef.current) void loadConversations();
 }, [loadConversations]);

 useRealtimeEvent("message.new", refreshIfOpen);
 useRealtimeEvent("notification.counter", refreshIfOpen);
 const direct = conversations.filter((c) => c.type === "direct").slice(0, 10);
 const group = conversations.filter((c) => c.type === "group").slice(0, 10);

 const handleMarkAll = async () => {
 try {
 await messagesApi.markAllRead();
 void loadConversations();
 } catch {
 /* non-critical */
 }
 };

 return (
 <Popover open={open} onOpenChange={setOpen}>
 <PopoverTrigger asChild>
 <Button
 variant="outline"
 size="icon"
 className="relative h-10 w-10 shrink-0 rounded-full hover:bg-muted/50"
 aria-label={
 unreadMessages > 0
 ? `${tc("messages")} (${unreadMessages})`
 : tc("messages")
 }
 >
 <MessageCircle className="h-5 w-5" aria-hidden="true" />
 {unreadMessages > 0 && (
 <Badge
 variant="destructive"
 className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[1.25rem] items-center justify-center px-1 py-0 text-[13px] font-semibold"
 >
 {unreadMessages > 99 ? "99+" : unreadMessages}
 </Badge>
 )}
 </Button>
 </PopoverTrigger>
 <PopoverContent
 align="end"
 sideOffset={8}
 className="w-[min(calc(100vw-1rem),24rem)] p-0"
 >
 <header className="flex items-center justify-between px-4 py-2.5 border-b">
 <p className="text-sm font-semibold">{tn("messages")}</p>
 {unreadMessages > 0 && (
 <button
 type="button"
 onClick={handleMarkAll}
 className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
 >
 <Check className="h-3.5 w-3.5" />
 {tm("markAllRead")}
 </button>
 )}
 </header>
 <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
 <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-transparent p-0">
 <TabsTrigger
 value="direct"
 className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
 >
 <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
 Direct
 </TabsTrigger>
 <TabsTrigger
 value="group"
 className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
 >
 <Users className="mr-1.5 h-3.5 w-3.5" />
 Groups
 </TabsTrigger>
 </TabsList>
 <ScrollArea className="max-h-[420px]">
 {loading && conversations.length === 0 ? (
 <div className="flex items-center justify-center py-8">
 <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
 </div>
 ) : (
 <>
 <TabsContent value="direct" className="m-0 divide-y divide-border">
 {direct.length === 0 ? (
 <p className="py-8 text-center text-xs text-muted-foreground">
 {tm("noConversations")}
 </p>
 ) : (
 direct.map((conversation) => (
 <ConversationRow
 key={conversation.id}
 conversation={conversation}
 currentUserId={user ? Number(user.id) : null}
 onNavigate={() => setOpen(false)}
 />
 ))
 )}
 </TabsContent>
 <TabsContent value="group" className="m-0 divide-y divide-border">
 {group.length === 0 ? (
 <p className="py-8 text-center text-xs text-muted-foreground">
 {tm("noConversations")}
 </p>
 ) : (
 group.map((conversation) => (
 <ConversationRow
 key={conversation.id}
 conversation={conversation}
 currentUserId={user ? Number(user.id) : null}
 onNavigate={() => setOpen(false)}
 />
 ))
 )}
 </TabsContent>
 </>
 )}
 </ScrollArea>
 </Tabs>
 <footer className="border-t p-2">
 <Button
 asChild
 variant="ghost"
 size="sm"
 className="w-full justify-center text-xs"
 onClick={() => setOpen(false)}
 >
 <Link href="/messages">{tc("viewAll")}</Link>
 </Button>
 </footer>
 </PopoverContent>
 </Popover>
 );
}

// Re-export for components that want to programmatically open messages.
export { type TabKey as MessagesDropdownTab };

// Exported helper the header can call when focused.
export function openMessages(router: ReturnType<typeof useRouter>) {
 router.push("/messages");
}
