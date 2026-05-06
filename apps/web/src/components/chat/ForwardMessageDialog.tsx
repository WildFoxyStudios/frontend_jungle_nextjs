"use client";

import { useEffect, useMemo, useState } from "react";
import { getDirectChatPeer, messagesApi, resolveConversationTitle } from "@jungle/api-client";
import type { Conversation, Message } from "@jungle/api-client";
import {
 Avatar,
 AvatarFallback,
 AvatarImage,
 Button,
 Checkbox,
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 Input,
 ScrollArea,
} from "@jungle/ui";
import { useAuthStore } from "@jungle/hooks";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import { Forward, Loader2, Search } from "lucide-react";

interface ForwardMessageDialogProps {
 open: boolean;
 message: Message | null;
 onClose: () => void;
 /** Optional: notify parent when forwarding succeeds so it can update local state if needed. */
 onForwarded?: (targetIds: number[]) => void;
}

/**
 * Forward a message to one or many conversations. Matches PHP
 * `chat-tab.phtml` right-click menu "Forward to…".
 */
export function ForwardMessageDialog({
 open,
 message,
 onClose,
 onForwarded,
}: ForwardMessageDialogProps) {
 const { user } = useAuthStore();
 const [conversations, setConversations] = useState<Conversation[]>([]);
 const [loading, setLoading] = useState(false);
 const [sending, setSending] = useState(false);
 const [selected, setSelected] = useState<Set<number>>(new Set());
 const [query, setQuery] = useState("");

 // Load the user's conversation list whenever the dialog opens.
 useEffect(() => {
 if (!open) return;
 setLoading(true);
 setSelected(new Set());
 setQuery("");
 messagesApi
 .getConversations()
 .then((r) => setConversations(Array.isArray(r?.data) ? r.data : []))
 .catch(() => toast.error("Failed to load conversations"))
 .finally(() => setLoading(false));
 }, [open]);

 const filtered = useMemo(() => {
 const q = query.trim().toLowerCase();
 // Never allow forwarding to the conversation the message originated in.
 const base = conversations.filter((c) => c.id !== message?.conversation_id);
 if (!q) return base;
 return base.filter((c) => {
 const title = resolveConversationTitle(c, user?.id).toLowerCase();
 const peer = getDirectChatPeer(c, user?.id);
 const hay = `${title} ${peer?.username ?? ""}`.toLowerCase();
 return hay.includes(q);
 });
 }, [conversations, query, message?.conversation_id, user?.id]);

 const toggle = (id: number) => {
 setSelected((prev) => {
 const next = new Set(prev);
 if (next.has(id)) {
 next.delete(id);
 } else {
 next.add(id);
 }
 return next;
 });
 };

 const handleForward = async () => {
 if (!message || selected.size === 0) return;
 setSending(true);
 try {
 const targetIds = Array.from(selected);
 await messagesApi.forwardMessage(message.id, targetIds);
 toast.success(
 targetIds.length === 1
 ? "Message forwarded"
 : `Message forwarded to ${targetIds.length} chats`,
 );
 onForwarded?.(targetIds);
 onClose();
 } catch {
 toast.error("Failed to forward message");
 } finally {
 setSending(false);
 }
 };

 const getTitle = (c: Conversation): string => resolveConversationTitle(c, user?.id);

 const getAvatar = (c: Conversation): string | undefined => {
 if (c.avatar) return c.avatar;
 return getDirectChatPeer(c, user?.id)?.avatar;
 };

 const preview = message
 ? message.message_type === "text"
 ? message.content
 : `[${message.message_type}]${message.content ? ` ${message.content}` : ""}`
 : "";

 return (
 <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
 <DialogContent className="max-w-md">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2">
 <Forward className="h-4 w-4" />
 Forward message
 </DialogTitle>
 <DialogDescription className="line-clamp-2 text-xs">{preview}</DialogDescription>
 </DialogHeader>

 <div className="relative">
 <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
 <Input
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder="Search chats…"
 className="h-8 pl-8 text-sm"
 />
 </div>

 <ScrollArea className="h-72 -mx-6 px-6">
 {loading ? (
 <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
 <Loader2 className="h-4 w-4 animate-spin" /> Loading…
 </div>
 ) : filtered.length === 0 ? (
 <p className="py-8 text-center text-sm text-muted-foreground">No chats found</p>
 ) : (
 <ul className="space-y-1">
 {filtered.map((c) => {
 const checked = selected.has(c.id);
 const title = getTitle(c);
 return (
 <li key={c.id}>
 <label
 htmlFor={`fwd-${c.id}`}
 className={`flex cursor-pointer items-center gap-3 border-2 border-transparent px-2 py-1.5 transition-colors ${
 checked
 ? "border-border bg-secondary/60"
 : "hover:border-foreground hover:bg-secondary/60"
 }`}
 >
 <Checkbox
 id={`fwd-${c.id}`}
 checked={checked}
 onCheckedChange={() => toggle(c.id)}
 />
 <Avatar className="h-8 w-8 shrink-0">
 <AvatarImage src={resolveAvatarUrl(getAvatar(c))} />
 <AvatarFallback>{title[0]?.toUpperCase() ?? "?"}</AvatarFallback>
 </Avatar>
 <span className="flex-1 truncate text-sm">{title}</span>
 </label>
 </li>
 );
 })}
 </ul>
 )}
 </ScrollArea>

 <DialogFooter className="sm:justify-between gap-2">
 <span className="text-xs text-muted-foreground self-center">
 {selected.size > 0
 ? `${selected.size} chat${selected.size > 1 ? "s" : ""} selected`
 : "Select one or more chats"}
 </span>
 <div className="flex gap-2">
 <Button variant="ghost" size="sm" onClick={onClose} disabled={sending}>
 Cancel
 </Button>
 <Button size="sm" onClick={handleForward} disabled={sending || selected.size === 0}>
 {sending && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
 Forward
 </Button>
 </div>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
}
