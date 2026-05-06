"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Message } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@jungle/ui";
import { CheckCheck, Forward, Gift, MoreHorizontal, Paperclip, Phone, Pin, PinOff, Reply, Trash2 } from "lucide-react";

const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

interface MessageBubbleProps {
 message: Message;
 onDelete?: (id: number) => void;
 onReact?: (id: number, reaction: string) => void;
 /** Start a reply workflow — parent will pin the message to a composer banner. */
 onReply?: (message: Message) => void;
 /** Open the "forward to…" dialog with this message as the source. */
 onForward?: (message: Message) => void;
 /** Toggle the pinned flag on this message. */
 onTogglePin?: (message: Message) => void;
 /** When set, shows a read receipt on this bubble (last own message in DM-style UX). */
 showSeenReceipt?: boolean;
 color?: string;
}

export function MessageBubble({
 message,
 onDelete,
 onReact,
 onReply,
 onForward,
 onTogglePin,
 showSeenReceipt,
 color,
}: MessageBubbleProps) {
 const { user } = useAuthStore();
 const isMine = user?.id === message.sender_id;
 /** Backend only accepts real message ids (optimistic rows use negative ids). */
 const hasPersistedId = Number.isFinite(message.id) && message.id > 0;
 const [hovered, setHovered] = useState(false);
 const [menuOpen, setMenuOpen] = useState(false);
 const [coarsePointer, setCoarsePointer] = useState(false);

 useEffect(() => {
 if (typeof window === "undefined" || !window.matchMedia) return;
 const mq = window.matchMedia("(pointer: coarse)");
 const sync = () => setCoarsePointer(mq.matches);
 sync();
 mq.addEventListener("change", sync);
 return () => mq.removeEventListener("change", sync);
 }, []);

 // Keep toolbar mounted while the ⋮ menu is open (Radix content is in a portal → mouse leaves bubble).
 const showActions = hovered || menuOpen || coarsePointer;

 const reactionEntries = Object.entries(message.reactions ?? {}).filter(([, count]) => count > 0);

 return (
 <div
 className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2 group`}
 onMouseEnter={() => setHovered(true)}
 onMouseLeave={() => setHovered(false)}
 >
 <div className="relative">
 {/* Forwarded + pinned badges */}
 {(message.forwarded_from || message.is_pinned) && (
 <div className={`flex items-center gap-1 mb-0.5 text-[10px] text-muted-foreground ${isMine ? "justify-end" : "justify-start"}`}>
 {message.forwarded_from ? (
 <span className="inline-flex items-center gap-0.5">
 <Forward className="h-2.5 w-2.5" /> Forwarded
 </span>
 ) : null}
 {message.is_pinned ? (
 <span className="inline-flex items-center gap-0.5">
 <Pin className="h-2.5 w-2.5" /> Pinned
 </span>
 ) : null}
 </div>
 )}
 <div
 className={`px-4 py-2 max-w-[70%] text-[15px] leading-relaxed ${
 isMine
 ? "ml-auto bg-primary text-primary-foreground rounded-[18px] rounded-br-md"
 : "mr-auto bg-surface-sunken text-foreground rounded-[18px] rounded-bl-md"
 }`}
 style={isMine ? { backgroundColor: color || "var(--primary)" } : {}}
 >
 {message.reply_to && (
 <div className="mb-2 line-clamp-2 border-l-2 border-border bg-background/40 p-2 text-[10px] italic opacity-90">
 <span className="mb-0.5 block font-semibold">{message.reply_to.sender?.first_name}:</span>
 {message.reply_to.content || "Media content"}
 </div>
 )}
 {message.message_type === "call" && (
 <p className="flex items-center gap-2 text-[13px] font-medium">
 <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
 {message.content}
 </p>
 )}
 {message.message_type === "text" && <p>{message.content}</p>}
 {message.message_type === "image" && message.media[0] && (
 <Image src={message.media[0].url} alt="Chat attachment" width={192} height={192} unoptimized className="h-48 w-48 border object-cover" />
 )}
 {message.message_type === "video" && message.media[0] && (
 <video src={message.media[0].url} className="w-48 border" controls />
 )}
 {message.message_type === "sticker" && (message.media[0]?.url ?? message.sticker_url) && (
 <Image src={message.media[0]?.url ?? message.sticker_url ?? ""} alt="sticker" width={80} height={80} unoptimized className="w-20 h-20 object-contain" />
 )}
 {message.message_type === "gift" && (
 <div className="text-center py-1">
 {message.gift?.image ? (
 <Image src={message.gift.image} alt={message.gift.name} width={64} height={64} unoptimized className="w-16 h-16 object-contain mx-auto" />
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
 <p
 className={`mt-1 text-xs ${
 isMine
 ? "flex items-center justify-end gap-1 text-primary-foreground/70"
 : "text-muted-foreground"
 }`}
 >
 <span>
 {(() => {
 const t = message.created_at ? new Date(message.created_at).getTime() : NaN;
 return Number.isFinite(t)
 ? new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
 : "";
 })()}
 </span>
 {isMine && showSeenReceipt && (
 <CheckCheck
 className="h-3.5 w-3.5 shrink-0 text-primary-foreground/90"
 aria-label="Read"
 />
 )}
 </p>
 </div>

 {/* Reactions display */}
 {reactionEntries.length > 0 && (
 <div className={`mt-0.5 flex gap-0.5 ${isMine ? "justify-end" : "justify-start"}`}>
 {reactionEntries.map(([emoji, count]) => (
 <span key={emoji} className="px-1.5 py-0.5 text-[13px] font-medium">
 {emoji} {count > 1 && count}
 </span>
 ))}
 </div>
 )}

 {/* Hover actions */}
 {showActions && (
 <div
 className={`absolute top-0 z-10 flex items-center gap-0.5 ${
 isMine ? "right-full mr-1" : "left-full ml-1"
 }`}
 >
 {onReact && hasPersistedId && (
 <div className="flex border bg-background p-0.5">
 {QUICK_REACTIONS.map((r) => (
 <button
 key={r}
 type="button"
 onClick={() => onReact(message.id, r)}
 className="px-0.5 text-sm transition-transform hover:scale-125"
 aria-label={`React with ${r}`}
 >
 {r}
 </button>
 ))}
 </div>
 )}
 {(onReply || onForward || onTogglePin || (isMine && onDelete)) && (
 <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} modal={false}>
 <DropdownMenuTrigger asChild>
 <button
 type="button"
 className="flex h-6 w-6 items-center justify-center border bg-background transition-colors hover:bg-secondary/60"
 aria-label="Message actions"
 >
 <MoreHorizontal className="h-3 w-3" />
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align={isMine ? "end" : "start"} className="z-[100] w-40">
 {onReply && hasPersistedId && (
 <DropdownMenuItem onSelect={() => onReply(message)}>
 <Reply className="mr-2 h-3.5 w-3.5" /> Reply
 </DropdownMenuItem>
 )}
 {onForward && hasPersistedId && (
 <DropdownMenuItem onSelect={() => onForward(message)}>
 <Forward className="mr-2 h-3.5 w-3.5" /> Forward
 </DropdownMenuItem>
 )}
 {onTogglePin && hasPersistedId && (
 <DropdownMenuItem onSelect={() => onTogglePin(message)}>
 {message.is_pinned ? (
 <>
 <PinOff className="mr-2 h-3.5 w-3.5" /> Unpin
 </>
 ) : (
 <>
 <Pin className="mr-2 h-3.5 w-3.5" /> Pin
 </>
 )}
 </DropdownMenuItem>
 )}
 {isMine && onDelete && hasPersistedId && (
 <>
 <DropdownMenuSeparator />
 <DropdownMenuItem
 onSelect={() => onDelete(message.id)}
 className="text-destructive focus:text-destructive"
 >
 <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
 </DropdownMenuItem>
 </>
 )}
 {!hasPersistedId && (
 <DropdownMenuItem disabled className="text-muted-foreground text-xs">
 Sending…
 </DropdownMenuItem>
 )}
 </DropdownMenuContent>
 </DropdownMenu>
 )}
 </div>
 )}
 </div>
 </div>
 );
}
