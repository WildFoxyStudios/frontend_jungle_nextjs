"use client";

import Image from "next/image";
import type { Message } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import { Gift, Paperclip } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { user } = useAuthStore();
  const isMine = user?.id === message.sender_id;

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
          isMine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
        }`}
      >
        {message.message_type === "text" && <p>{message.content}</p>}
        {message.message_type === "image" && message.media[0] && (
          <div className="relative w-48 h-48 rounded overflow-hidden">
            <Image src={message.media[0].url} alt="" fill className="object-cover" />
          </div>
        )}
        {message.message_type === "sticker" && message.media[0] && (
          <Image src={message.media[0].url} alt="sticker" width={80} height={80} />
        )}
        {message.message_type === "gift" && (
          <div className="text-center">
            <Gift className="h-8 w-8 mx-auto text-primary" />
            <p className="text-xs mt-1">{message.content}</p>
          </div>
        )}
        {message.message_type === "file" && message.media[0] && (
          <a href={message.media[0].url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline text-xs">
            <Paperclip className="h-3 w-3" /> {message.content || "File"}
          </a>
        )}
        <p className={`text-xs mt-1 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
