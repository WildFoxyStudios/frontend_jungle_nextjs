"use client";

import { useState } from "react";
import type { Message } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import { Gift, Paperclip, Trash2 } from "lucide-react";

const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

interface MessageBubbleProps {
  message: Message;
  onDelete?: (id: number) => void;
  onReact?: (id: number, reaction: string) => void;
  color?: string;
}

export function MessageBubble({ message, onDelete, onReact, color }: MessageBubbleProps) {
  const { user } = useAuthStore();
  const isMine = user?.id === message.sender_id;
  const [showActions, setShowActions] = useState(false);

  const reactionEntries = Object.entries(message.reactions ?? {}).filter(([, count]) => count > 0);

  return (
    <div
      className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="relative">
        <div
          className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
            isMine ? "text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm text-foreground"
          }`}
          style={isMine ? { backgroundColor: color || "var(--primary)" } : {}}
        >
          {message.reply_to && (
            <div className="mb-2 p-2 rounded-lg bg-black/10 border-l-4 border-white/30 text-[10px] opacity-80 line-clamp-2 italic">
              <span className="font-bold block mb-0.5">{message.reply_to.sender?.first_name}:</span>
              {message.reply_to.content || "Media content"}
            </div>
          )}
          {message.message_type === "text" && <p>{message.content}</p>}
          {message.message_type === "image" && message.media[0] && (
            <img src={message.media[0].url} alt="" className="w-48 h-48 rounded object-cover" />
          )}
          {message.message_type === "video" && message.media[0] && (
            <video src={message.media[0].url} className="w-48 rounded" controls />
          )}
          {message.message_type === "sticker" && (message.media[0]?.url ?? message.sticker_url) && (
            <img src={message.media[0]?.url ?? message.sticker_url} alt="sticker" className="w-20 h-20 object-contain" />
          )}
          {message.message_type === "gift" && (
            <div className="text-center py-1">
              {message.gift?.image ? (
                <img src={message.gift.image} alt={message.gift.name} className="w-16 h-16 object-contain mx-auto" />
              ) : (
                <Gift className="h-8 w-8 mx-auto text-primary" />
              )}
              <p className="text-xs mt-1 font-medium">{message.gift?.name ?? message.content}</p>
              {message.gift?.price && (
                <p className="text-xs text-muted-foreground">{message.gift.currency} {message.gift.price}</p>
              )}
            </div>
          )}
          {message.message_type === "audio" && message.media[0] && (
            <audio src={message.media[0].url} controls className="max-w-[200px]" />
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

        {/* Reactions display */}
        {reactionEntries.length > 0 && (
          <div className={`flex gap-0.5 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}>
            {reactionEntries.map(([emoji, count]) => (
              <span key={emoji} className="text-xs bg-muted rounded-full px-1.5 py-0.5 border">
                {emoji} {count > 1 && count}
              </span>
            ))}
          </div>
        )}

        {/* Hover actions */}
        {showActions && (
          <div className={`absolute top-0 ${isMine ? "right-full mr-1" : "left-full ml-1"} flex items-center gap-0.5`}>
            {onReact && (
              <div className="flex bg-background border rounded-full shadow-sm p-0.5">
                {QUICK_REACTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => onReact(message.id, r)}
                    className="hover:scale-125 transition-transform text-sm px-0.5"
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
            {isMine && onDelete && (
              <button
                onClick={() => onDelete(message.id)}
                className="h-6 w-6 flex items-center justify-center bg-background border rounded-full shadow-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
