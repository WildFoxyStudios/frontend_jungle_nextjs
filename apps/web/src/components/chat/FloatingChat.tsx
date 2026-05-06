"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { getDirectChatPeer, messagesApi, resolveConversationTitle } from "@jungle/api-client";
import type { Conversation, Message } from "@jungle/api-client";
import { useAuthStore, useRealtimeStore, useOnlineUsers, useRealtimeEvent } from "@jungle/hooks";
import {
 Avatar, AvatarFallback, AvatarImage, Button, Badge, Input, ScrollArea,
} from "@jungle/ui";
import { MessageCircle, X, Minimize2, Send, ChevronDown } from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ChatWindow {
 conversation: Conversation;
 minimized: boolean;
}

export function FloatingChat() {
 const { user } = useAuthStore();
 const t = useTranslations("messages");
 const tc = useTranslations("common");
 const { unreadMessages } = useRealtimeStore();
 const onlineUsers = useOnlineUsers();
 const [showList, setShowList] = useState(false);
 const [conversations, setConversations] = useState<Conversation[]>([]);
 const [openChats, setOpenChats] = useState<ChatWindow[]>([]);
 const [loading, setLoading] = useState(false);

 useEffect(() => {
 if (!showList || !user) return;
 setLoading(true);
 messagesApi.getConversations()
 .then((r) => setConversations(Array.isArray(r?.data) ? r.data : []))
 .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load conversations"))
 .finally(() => setLoading(false));
 }, [showList, user]);

 const openChat = (conv: Conversation) => {
 if (openChats.find((c) => c.conversation.id === conv.id)) {
 setOpenChats((prev) =>
 prev.map((c) => c.conversation.id === conv.id ? { ...c, minimized: false } : c)
 );
 } else {
 setOpenChats((prev) => [...prev.slice(-2), { conversation: conv, minimized: false }]);
 }
 setShowList(false);
 };

 const closeChat = (id: number) => {
 setOpenChats((prev) => prev.filter((c) => c.conversation.id !== id));
 };

 const toggleMinimize = (id: number) => {
 setOpenChats((prev) =>
 prev.map((c) => c.conversation.id === id ? { ...c, minimized: !c.minimized } : c)
 );
 };

 if (!user) return null;

 return (
 // Desktop only — `lg+`. On smaller viewports the header / hamburger nav
 // cover messages; a floating bubble would crowd the thumb zone.
 <div className="fixed bottom-0 right-4 z-40 hidden items-end gap-2 lg:flex">
 {/* Open chat windows */}
 {openChats.map((chat) => (
 <ChatBubble
 key={chat.conversation.id}
 conversation={chat.conversation}
 minimized={chat.minimized}
 onClose={() => closeChat(chat.conversation.id)}
 onToggleMinimize={() => toggleMinimize(chat.conversation.id)}
 />
 ))}

 {/* Conversation list */}
 {showList && (
 <div className="w-72 overflow-hidden rounded-t-lg shadow-2xl bg-card">
 <div className="flex items-center justify-between border-b border-border px-3 py-2.5 surface-raised">
 <span className="text-sm font-semibold">{t("title")}</span>
 <div className="flex gap-1">
 <Link href="/messages" className="text-xs hover:underline opacity-80">{t("seeAll")}</Link>
 <button type="button" onClick={() => setShowList(false)} aria-label={t("closeChat")}>
 <X className="h-4 w-4" />
 </button>
 </div>
 </div>
 <ScrollArea className="max-h-80">
 {loading ? (
 <p className="text-sm text-muted-foreground text-center py-4">{tc("loading")}</p>
 ) : conversations.length === 0 ? (
 <p className="text-sm text-muted-foreground text-center py-4">{t("noConversations")}</p>
 ) : (
 conversations.slice(0, 10).map((conv) => {
 const peer = getDirectChatPeer(conv, user?.id);
 const rowTitle = resolveConversationTitle(conv, user?.id);
 return (
 <button type="button"
 key={conv.id}
 onClick={() => openChat(conv)}
 className="flex w-full items-center gap-2 border-2 border-transparent px-3 py-2 text-left transition-colors hover:border-foreground hover:bg-secondary/60"
 >
 <div className="relative">
 <Avatar className="h-8 w-8">
 <AvatarImage src={resolveAvatarUrl(conv.avatar ?? peer?.avatar)} />
 <AvatarFallback>{(rowTitle.trim().charAt(0) || "?").toUpperCase()}</AvatarFallback>
 </Avatar>
 {peer && onlineUsers.has(Number(peer.id)) && (
 <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
 )}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium truncate">
 {rowTitle}
 </p>
 <p className="text-xs text-muted-foreground truncate">{conv.last_message?.content}</p>
 </div>
 {conv.unread_count > 0 && (
 <Badge variant="destructive" className="text-[10px] px-1">{conv.unread_count}</Badge>
 )}
 </button>
 );
 })
 )}
 </ScrollArea>
 </div>
 )}

 {/* Toggle button */}
 <button
 onClick={() => setShowList(!showList)}
	aria-label={t("openMessages")}
 className="relative mb-4 rounded-full bg-primary p-3 text-primary-foreground shadow-lg transition-opacity hover:opacity-90"
 >
 <MessageCircle className="h-5 w-5" />
 {unreadMessages > 0 && (
 <Badge
 variant="destructive"
 className="absolute -top-1 -right-1 text-[10px] px-1 min-w-[1rem] h-4 flex items-center justify-center"
 >
 {unreadMessages > 9 ? "9+" : unreadMessages}
 </Badge>
 )}
 </button>
 </div>
 );
}

function ChatBubble({
 conversation,
 minimized,
 onClose,
 onToggleMinimize,
}: {
 conversation: Conversation;
 minimized: boolean;
 onClose: () => void;
 onToggleMinimize: () => void;
}) {
 const { user } = useAuthStore();
 const t = useTranslations("messages");
 const { registerOpenMessageThread, unregisterOpenMessageThread } = useRealtimeStore();
 const onlineUsers = useOnlineUsers();
 const [messages, setMessages] = useState<Message[]>([]);
 const [input, setInput] = useState("");
 const [sending, setSending] = useState(false);
 const scrollRef = useRef<HTMLDivElement>(null);
 const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const typingIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const peer = getDirectChatPeer(conversation, user?.id);
 const title = resolveConversationTitle(conversation, user?.id);
 const isOnline = peer ? onlineUsers.has(Number(peer.id)) : false;

 const refreshMessages = useCallback(() => {
 messagesApi
 .getMessages(conversation.id)
 .then((r) => setMessages(Array.isArray(r?.data) ? [...r.data].reverse() : []))
 .catch((err) => toast.error(err instanceof Error ? err.message : t("failedToLoadMessages")));
 }, [conversation.id, t]);

 useEffect(() => {
 if (!minimized) {
 registerOpenMessageThread(conversation.id);
 void messagesApi.markRead(conversation.id).catch((e) => { console.error("[FloatingChat] markRead failed", e); });
 refreshMessages();
 }
 return () => unregisterOpenMessageThread(conversation.id);
 }, [conversation.id, minimized, registerOpenMessageThread, unregisterOpenMessageThread, refreshMessages]);

 const onRemoteMessage = useCallback(
 (data: unknown) => {
 const d = data as { conversation_id?: number };
 if (Number(d?.conversation_id) !== conversation.id) return;
 refreshMessages();
 },
 [conversation.id, refreshMessages],
 );

 useRealtimeEvent("message.new", onRemoteMessage);

 useEffect(() => {
 if (scrollRef.current) {
 scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
 }
 }, [messages]);

 const flushTypingStop = useCallback(() => {
 if (typingDebounceRef.current) {
 clearTimeout(typingDebounceRef.current);
 typingDebounceRef.current = null;
 }
 if (typingIdleRef.current) {
 clearTimeout(typingIdleRef.current);
 typingIdleRef.current = null;
 }
 void messagesApi.stopTypingIndicator(conversation.id).catch((e) => { console.error("[FloatingChat] stopTyping failed", e); });
 }, [conversation.id]);

 const scheduleTyping = useCallback(() => {
 if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
 typingDebounceRef.current = setTimeout(() => {
 typingDebounceRef.current = null;
 void messagesApi.sendTypingIndicator(conversation.id).catch((e) => { console.error("[FloatingChat] sendTyping failed", e); });
 }, 400);
 if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
 typingIdleRef.current = setTimeout(() => {
 typingIdleRef.current = null;
 flushTypingStop();
 }, 3000);
 }, [conversation.id, flushTypingStop]);

 useEffect(() => {
 return () => {
 if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
 if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
 };
 }, []);

 const handleSend = async () => {
 if (!input.trim() || sending) return;
 flushTypingStop();
 setSending(true);
 try {
 const msg = await messagesApi.sendMessage(conversation.id, { content: input });
 setMessages((prev) => [...prev, msg]);
 setInput("");
 } catch { toast.error(t("failedToSend")); }
 finally { setSending(false); }
 };

 return (
 <div className={`flex w-72 flex-col overflow-hidden rounded-t-2xl shadow-2xl border border-${minimized ? "" : "h-96"}`}>
 {/* Header */}
 <div
 className="flex cursor-pointer items-center gap-2 border-b border-border px-3 py-2.5 surface-raised"
 onClick={onToggleMinimize}
 >
 <div className="relative">
 <Avatar className="h-6 w-6">
 <AvatarImage src={resolveAvatarUrl(peer?.avatar ?? conversation.avatar)} />
 <AvatarFallback className="text-[10px]">{(title.trim().charAt(0) || "?").toUpperCase()}</AvatarFallback>
 </Avatar>
 {isOnline && (
 <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400 border border-primary" />
 )}
 </div>
 <div className="flex-1 min-w-0">
 <span className="text-sm font-semibold truncate block">{title}</span>
 {isOnline && <span className="text-[10px] opacity-70">{t("online")}</span>}
 </div>
 <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
 <button type="button" onClick={onToggleMinimize} className="hover:opacity-70" aria-label={t("minimize")}>
 {minimized ? <ChevronDown className="h-3.5 w-3.5 rotate-180" /> : <Minimize2 className="h-3.5 w-3.5" />}
 </button>
 <button type="button" onClick={onClose} className="hover:opacity-70" aria-label={t("closeChat")}>
 <X className="h-3.5 w-3.5" />
 </button>
 </div>
 </div>

 {!minimized && (
 <>
 {/* Messages */}
 <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1.5">
 {messages.map((msg) => {
 const isMe = msg.sender_id === user?.id;
 return (
 <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
 <div
 className={`px-3 py-1.5 max-w-[80%] text-sm leading-relaxed ${
 isMe
 ? "ml-auto bg-primary text-primary-foreground rounded-lg rounded-br-md"
 : "mr-auto surface-sunken rounded-lg rounded-bl-md"
 }`}
 >
 {msg.content}
 </div>
 </div>
 );
 })}
 </div>

 {/* Input */}
 <form
 className="flex items-center gap-1 border-t border-border p-2"
 onSubmit={(e) => { e.preventDefault(); handleSend(); }}
 >
 <Input
 value={input}
 onChange={(e) => {
 setInput(e.target.value);
 scheduleTyping();
 }}
 onBlur={() => flushTypingStop()}
 placeholder="Aa"
 className="flex-1 h-8 text-sm"
 disabled={sending}
 />
 <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={sending || !input.trim()}>
 <Send className="h-3.5 w-3.5" />
 </Button>
 </form>
 </>
 )}
 </div>
 );
}
