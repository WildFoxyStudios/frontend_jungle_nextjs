"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { messagesApi } from "@jungle/api-client";
import type { Conversation, Message } from "@jungle/api-client";
import { useAuthStore, useRealtimeStore, useOnlineUsers } from "@jungle/hooks";
import {
  Avatar, AvatarFallback, AvatarImage, Button, Badge, Input, ScrollArea,
} from "@jungle/ui";
import { MessageCircle, X, Minimize2, Send, ChevronDown } from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";

interface ChatWindow {
  conversation: Conversation;
  minimized: boolean;
}

export function FloatingChat() {
  const { user } = useAuthStore();
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
    <div className="fixed bottom-0 right-4 z-40 flex items-end gap-2">
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
        <div className="w-72 bg-background border rounded-t-lg shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b bg-primary text-primary-foreground">
            <span className="text-sm font-semibold">Messages</span>
            <div className="flex gap-1">
              <Link href="/messages" className="text-xs hover:underline opacity-80">See all</Link>
              <button onClick={() => setShowList(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <ScrollArea className="max-h-80">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading…</p>
            ) : conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No conversations</p>
            ) : (
              conversations.slice(0, 10).map((conv) => {
                const other = conv.members?.find((m) => m.user.id !== user.id)?.user;
                return (
                  <button
                    key={conv.id}
                    onClick={() => openChat(conv)}
                    className="flex items-center gap-2 px-3 py-2 w-full hover:bg-muted/50 text-left"
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={resolveAvatarUrl(conv.avatar ?? other?.avatar)} />
                        <AvatarFallback>{(conv.name ?? other?.first_name ?? "?")[0]}</AvatarFallback>
                      </Avatar>
                      {other && onlineUsers.has(other.id) && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {conv.name ?? `${other?.first_name ?? ""} ${other?.last_name ?? ""}`}
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
        className="relative bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:opacity-90 transition-opacity mb-4"
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
  const onlineUsers = useOnlineUsers();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const other = conversation.members?.find((m) => m.user.id !== user?.id)?.user;
  const title = conversation.name ?? `${other?.first_name ?? ""} ${other?.last_name ?? ""}`;
  const isOnline = other ? onlineUsers.has(other.id) : false;

  useEffect(() => {
    if (minimized) return;
    messagesApi.getMessages(conversation.id)
      .then((r) => setMessages(Array.isArray(r?.data) ? r.data.reverse() : []))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load messages"));
  }, [conversation.id, minimized]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const msg = await messagesApi.sendMessage(conversation.id, { content: input });
      setMessages((prev) => [...prev, msg]);
      setInput("");
    } catch { /* silent */ }
    finally { setSending(false); }
  };

  return (
    <div className={`w-72 bg-background border rounded-t-lg shadow-lg overflow-hidden flex flex-col ${minimized ? "" : "h-96"}`}>
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b bg-primary text-primary-foreground cursor-pointer"
        onClick={onToggleMinimize}
      >
        <div className="relative">
          <Avatar className="h-6 w-6">
            <AvatarImage src={resolveAvatarUrl(other?.avatar)} />
            <AvatarFallback className="text-[10px]">{(other?.first_name ?? "?")[0]}</AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400 border border-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold truncate block">{title}</span>
          {isOnline && <span className="text-[10px] opacity-70">Online</span>}
        </div>
        <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button onClick={onToggleMinimize} className="hover:opacity-70">
            {minimized ? <ChevronDown className="h-3.5 w-3.5 rotate-180" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
          <button onClick={onClose} className="hover:opacity-70">
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
                  <div className={`max-w-[80%] px-3 py-1.5 rounded-2xl text-sm ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <form
            className="flex items-center gap-1 p-2 border-t"
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
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
