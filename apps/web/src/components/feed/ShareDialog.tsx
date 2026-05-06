"use client";

import { useState, useEffect } from "react";
import {
 postsApi,
 messagesApi,
 groupsApi,
 pagesApi,
 usersApi,
 getDirectChatPeer,
 resolveConversationTitle,
} from "@jungle/api-client";
import type { Conversation, Group, Page, PublicUser } from "@jungle/api-client";
import {
 Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
 Button, Textarea, Separator, Avatar, AvatarImage, AvatarFallback, ScrollArea,
 Input,
} from "@jungle/ui";
import { Share2, Copy, ExternalLink, Check, Send, Users, FileText, UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@jungle/hooks";

interface ShareDialogProps {
 postId: number;
 children: React.ReactNode;
}

export function ShareDialog({ postId, children }: ShareDialogProps) {
 const { user } = useAuthStore();
 const [open, setOpen] = useState(false);
 const [content, setContent] = useState("");
 const [sharing, setSharing] = useState(false);
 const [copied, setCopied] = useState(false);
 const [conversations, setConversations] = useState<Conversation[]>([]);
 const [sendingTo, setSendingTo] = useState<number | null>(null);

 // Plan §3.13 SH1-SH3 — internal re-share targets. Lists stay empty until
 // the user expands the "Post to…" section so we avoid waterfalled requests.
 const [myGroups, setMyGroups] = useState<Group[]>([]);
 const [myPages, setMyPages] = useState<Page[]>([]);
 const [userQuery, setUserQuery] = useState("");
 const [userResults, setUserResults] = useState<PublicUser[]>([]);
 const [postingTo, setPostingTo] = useState<string | null>(null);

 const postUrl = typeof window !== "undefined"
 ? `${window.location.origin}/post/${postId}`
 : `/post/${postId}`;

 useEffect(() => {
 const onFeedKbd = (ev: Event) => {
 const e = ev as CustomEvent<{ action?: string; postId?: number }>;
 if (e.detail?.postId !== postId || e.detail.action !== "share") return;
 setOpen(true);
 };
 window.addEventListener("wowonder-feed-kbd", onFeedKbd as EventListener);
 return () => window.removeEventListener("wowonder-feed-kbd", onFeedKbd as EventListener);
 }, [postId]);

 useEffect(() => {
 if (!open) return;
 messagesApi.getConversations()
 .then((r) => setConversations(Array.isArray(r?.data) ? r.data : []))
 .catch((err) => { console.error("[ShareDialog] getConversations failed", err); });
 // Prefetch groups/pages eagerly — admins typically have a handful at
 // most, so the payload is tiny and the UX is snappier.
 groupsApi.getMyGroups()
 .then((r) => setMyGroups(Array.isArray(r?.data) ? r.data : []))
 .catch(() => undefined);
 pagesApi.getMyPages()
 .then((r) => setMyPages(Array.isArray(r?.data) ? r.data : []))
 .catch(() => undefined);
 }, [open]);

 // Debounced username search for the "share to user's wall" target.
 useEffect(() => {
 const q = userQuery.trim();
 if (q.length < 2) {
 setUserResults([]);
 return;
 }
 const id = setTimeout(() => {
 // `searchUsers` returns a flat array, not a paginated envelope.
 usersApi
 .searchUsers(q, 5)
 .then((rows) => setUserResults(Array.isArray(rows) ? rows : []))
 .catch(() => setUserResults([]));
 }, 300);
 return () => clearTimeout(id);
 }, [userQuery]);

 const handleSendToConversation = async (convId: number) => {
 setSendingTo(convId);
 try {
 await messagesApi.sendMessage(convId, { content: postUrl, type: "text" });
 toast.success("Sent!");
 } catch {
 toast.error("Failed to send");
 } finally {
 setSendingTo(null);
 }
 };

 const handleShareToTimeline = async () => {
 setSharing(true);
 try {
 await postsApi.sharePost(postId, content);
 toast.success("Shared to your timeline!");
 setOpen(false);
 setContent("");
 } catch {
 toast.error("Failed to share");
 } finally {
 setSharing(false);
 }
 };

 /**
 * Generic "share to X" helper. The backend accepts exactly one of
 * `group_id` / `page_id` / `user_wall_id`; picking the matching field is
 * the caller's responsibility.
 */
 const handleShareToTarget = async (
 key: string,
 target: { group_id?: number; page_id?: number; user_wall_id?: number },
 label: string,
 ) => {
 setPostingTo(key);
 try {
 await postsApi.sharePost(postId, content, target);
 toast.success(`Shared to ${label}`);
 setOpen(false);
 setContent("");
 } catch {
 toast.error("Failed to share");
 } finally {
 setPostingTo(null);
 }
 };

 const handleCopyLink = async () => {
 try {
 await navigator.clipboard.writeText(postUrl);
 setCopied(true);
 toast.success("Link copied!");
 setTimeout(() => setCopied(false), 2000);
 } catch {
 toast.error("Failed to copy");
 }
 };

 const handleExternal = (platform: string) => {
 const text = encodeURIComponent("Check this out on Jungle!");
 const url = encodeURIComponent(postUrl);
 // Plan §3.13 SH4 — keep the 5 original networks and add Reddit / VK /
 // Pinterest which match the PHP Sunshine share dialog.
 const urls: Record<string, string> = {
 twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
 facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
 linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
 whatsapp: `https://wa.me/?text=${text}%20${url}`,
 telegram: `https://t.me/share/url?url=${url}&text=${text}`,
 reddit: `https://www.reddit.com/submit?url=${url}&title=${text}`,
 vk: `https://vk.com/share.php?url=${url}`,
 pinterest: `https://pinterest.com/pin/create/button/?url=${url}&description=${text}`,
 };
 if (urls[platform]) window.open(urls[platform], "_blank", "width=600,height=400");
 };

 return (
 <Dialog open={open} onOpenChange={setOpen}>
 <DialogTrigger asChild>{children}</DialogTrigger>
 <DialogContent className="sm:max-w-md">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2">
 <Share2 className="h-5 w-5" /> Share Post
 </DialogTitle>
 </DialogHeader>

 <div className="space-y-4">
 {/* Share to timeline */}
 <div className="space-y-2">
 <p className="text-sm font-medium">Share to your timeline</p>
 <Textarea
 value={content}
 onChange={(e) => setContent(e.target.value)}
 placeholder="Say something about this…"
 rows={2}
 className="resize-none"
 />
 <Button onClick={handleShareToTimeline} disabled={sharing} className="w-full">
 {sharing ? "Sharing…" : "Share to Timeline"}
 </Button>
 </div>

 <Separator />

 {/* Copy link */}
 <div className="space-y-2">
 <p className="text-sm font-medium">Copy link</p>
 <div className="flex gap-2">
 <code className="flex-1 truncate bg-muted/40 px-3 py-2 text-xs rounded-md">
 {postUrl}
 </code>
 <Button variant="outline" size="icon" onClick={handleCopyLink}>
 {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
 </Button>
 </div>
 </div>

 <Separator />

 {/* Send to conversation */}
 {conversations.length > 0 && (
 <>
 <Separator />
 <div className="space-y-2">
 <p className="text-sm font-medium">Send in a message</p>
 <ScrollArea className="max-h-36">
 <div className="space-y-1">
 {conversations.slice(0, 8).map((conv) => {
 const peer = getDirectChatPeer(conv, user?.id);
 const name = resolveConversationTitle(conv, user?.id);
 return (
 <div key={conv.id} className="flex items-center gap-2 border-2 border-transparent p-1.5 hover:border-foreground hover:bg-secondary/60">
 <Avatar className="h-8 w-8">
 <AvatarImage src={conv.avatar ?? peer?.avatar} />
 <AvatarFallback>{(name.trim().charAt(0) || "?").toUpperCase()}</AvatarFallback>
 </Avatar>
 <span className="flex-1 text-sm truncate">{name || "Conversation"}</span>
 <Button
 variant="ghost"
 size="icon"
 className="h-7 w-7 shrink-0"
 disabled={sendingTo === conv.id}
 onClick={() => handleSendToConversation(conv.id)}
 >
 <Send className="h-3.5 w-3.5" />
 </Button>
 </div>
 );
 })}
 </div>
 </ScrollArea>
 </div>
 </>
 )}

 {/* Plan §3.13 SH1 — share to one of my groups */}
 {myGroups.length > 0 && (
 <>
 <Separator />
 <div className="space-y-2">
 <p className="text-sm font-medium flex items-center gap-1.5">
 <Users className="h-4 w-4" /> Share to a group
 </p>
 <ScrollArea className="max-h-32">
 <div className="space-y-1">
 {myGroups.slice(0, 10).map((g) => (
 <div key={g.id} className="flex items-center gap-2 border-2 border-transparent p-1.5 hover:border-foreground hover:bg-secondary/60">
 <Avatar className="h-8 w-8">
 <AvatarImage src={g.avatar} />
 <AvatarFallback>{g.name[0]?.toUpperCase()}</AvatarFallback>
 </Avatar>
 <span className="flex-1 text-sm truncate">{g.name}</span>
 <Button
 variant="ghost"
 size="sm"
 className="h-7 shrink-0"
 disabled={postingTo === `group-${g.id}`}
 onClick={() =>
 handleShareToTarget(`group-${g.id}`, { group_id: g.id }, g.name)
 }
 >
 Share
 </Button>
 </div>
 ))}
 </div>
 </ScrollArea>
 </div>
 </>
 )}

 {/* Plan §3.13 SH2 — post as a page I administer */}
 {myPages.length > 0 && (
 <>
 <Separator />
 <div className="space-y-2">
 <p className="text-sm font-medium flex items-center gap-1.5">
 <FileText className="h-4 w-4" /> Post as a page
 </p>
 <ScrollArea className="max-h-32">
 <div className="space-y-1">
 {myPages.slice(0, 10).map((p) => (
 <div key={p.id} className="flex items-center gap-2 border-2 border-transparent p-1.5 hover:border-foreground hover:bg-secondary/60">
 <Avatar className="h-8 w-8">
 <AvatarImage src={p.avatar} />
 <AvatarFallback>{p.name[0]?.toUpperCase()}</AvatarFallback>
 </Avatar>
 <span className="flex-1 text-sm truncate">{p.name}</span>
 <Button
 variant="ghost"
 size="sm"
 className="h-7 shrink-0"
 disabled={postingTo === `page-${p.id}`}
 onClick={() =>
 handleShareToTarget(`page-${p.id}`, { page_id: p.id }, p.name)
 }
 >
 Share
 </Button>
 </div>
 ))}
 </div>
 </ScrollArea>
 </div>
 </>
 )}

 {/* Plan §3.13 SH3 — post to another user's wall */}
 <Separator />
 <div className="space-y-2">
 <p className="text-sm font-medium flex items-center gap-1.5">
 <UserIcon className="h-4 w-4" /> Post to someone&apos;s wall
 </p>
 <Input
 value={userQuery}
 onChange={(e) => setUserQuery(e.target.value)}
 placeholder="Search by username or name…"
 />
 {userResults.length > 0 && (
 <div className="space-y-1 border p-1 rounded-md">
 {userResults.map((u) => (
 <div key={u.id} className="flex items-center gap-2 border border-transparent p-1.5 hover:bg-muted/50 rounded-md">
 <Avatar className="h-7 w-7">
 <AvatarImage src={u.avatar} />
 <AvatarFallback>{(u.first_name || u.username)[0]?.toUpperCase()}</AvatarFallback>
 </Avatar>
 <span className="flex-1 text-sm truncate">
 {u.first_name} {u.last_name}{" "}
 <span className="text-xs text-muted-foreground">@{u.username}</span>
 </span>
 <Button
 variant="ghost"
 size="sm"
 className="h-7 shrink-0"
 disabled={postingTo === `user-${u.id}`}
 onClick={() =>
 handleShareToTarget(
 `user-${u.id}`,
 { user_wall_id: u.id },
 `${u.first_name}'s wall`,
 )
 }
 >
 Post
 </Button>
 </div>
 ))}
 </div>
 )}
 </div>

 <Separator />

 {/* External share */}
 <div className="space-y-2">
 <p className="text-sm font-medium">Share externally</p>
 <div className="flex gap-2 flex-wrap">
 {[
 { key: "twitter", label: "X / Twitter" },
 { key: "facebook", label: "Facebook" },
 { key: "linkedin", label: "LinkedIn" },
 { key: "whatsapp", label: "WhatsApp" },
 { key: "telegram", label: "Telegram" },
 { key: "reddit", label: "Reddit" },
 { key: "vk", label: "VK" },
 { key: "pinterest", label: "Pinterest" },
 ].map((p) => (
 <Button key={p.key} variant="outline" size="sm" className="gap-1.5" onClick={() => handleExternal(p.key)}>
 <ExternalLink className="h-3.5 w-3.5" /> {p.label}
 </Button>
 ))}
 </div>
 </div>
 </div>
 </DialogContent>
 </Dialog>
 );
}
