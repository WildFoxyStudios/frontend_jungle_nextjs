"use client";

import { useEffect, useRef, useState } from "react";
import { messagesApi } from "@jungle/api-client";
import type { Message } from "@jungle/api-client";
import { useRealtimeStore, useAuthStore } from "@jungle/hooks";
import { Button, Input, ScrollArea } from "@jungle/ui";
import { toast } from "sonner";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

interface ChatWindowProps {
  conversationId: number;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { typingUsers, send } = useRealtimeStore();
  const { user } = useAuthStore();

  const isTyping = (typingUsers.get(conversationId)?.length ?? 0) > 0;

  useEffect(() => {
    messagesApi.getMessages(conversationId)
      .then((r) => {
        setMessages(r.data);
        setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
      })
      .catch(() => {});
  }, [conversationId]);

  const handleSend = async () => {
    if (!content.trim()) return;
    const optimistic: Message = {
      id: Date.now(),
      conversation_id: conversationId,
      sender_id: user?.id ?? 0,
      content,
      message_type: "text",
      media: [],
      is_favorited: false,
      is_pinned: false,
      reactions: {},
      created_at: new Date().toISOString(),
      sender: user ? { ...user, is_online: true } : { id: 0, uuid: "", username: "", first_name: "You", last_name: "", avatar: "", is_verified: false, is_online: true, is_pro: 0 },
    };
    setMessages((prev) => [...prev, optimistic]);
    setContent("");
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

    try {
      const sent = await messagesApi.sendMessage(conversationId, { content, type: "text" });
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? sent : m));
    } catch {
      toast.error("Failed to send message");
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </ScrollArea>
      <div className="border-t p-3 flex gap-2">
        <Input
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            send("typing.start", { conversation_id: conversationId });
          }}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Type a message…"
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={!content.trim()}>Send</Button>
      </div>
    </div>
  );
}
