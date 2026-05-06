"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, getDirectChatPeer, messagesApi, resolveConversationTitle, usersApi } from "@jungle/api-client";
import type { Conversation } from "@jungle/api-client";
import {
 Avatar, AvatarFallback, AvatarImage, Badge, Skeleton, Button, Input, PageContainer,
} from "@jungle/ui";
import { useAuthStore, useRealtimeEvent } from "@jungle/hooks";
import { EmptyState } from "@/components/shared/EmptyState";
import { CreateGroupChatDialog } from "@/components/chat/CreateGroupChatDialog";
import { BellOff, Loader2, MessageCircle, Megaphone, Pin, Search, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
export default function MessagesPage() {
 const { user } = useAuthStore();
 const router = useRouter();
 const searchParams = useSearchParams();
 const userIdQ = searchParams.get("userId");
 const usernameQ = searchParams.get("user");
 const bootstrapTarget = Boolean(userIdQ || usernameQ);

 const [conversations, setConversations] = useState<Conversation[]>([]);
 const [loading, setLoading] = useState(true);
 const [openingChat, setOpeningChat] = useState(bootstrapTarget);
 const [search, setSearch] = useState("");
 const [groupDialogOpen, setGroupDialogOpen] = useState(false);
 const t = useTranslations("messages");

 const reloadConversations = useCallback(() => {
 messagesApi
 .getConversations()
 .then((r) => setConversations(Array.isArray(r?.data) ? r.data : []))
 .catch(() => {
 /* non-critical */
 });
 }, []);

 useEffect(() => {
 let cancelled = false;
 setLoading(true);
 messagesApi
 .getConversations()
 .then((r) => {
 if (!cancelled) setConversations(Array.isArray(r?.data) ? r.data : []);
 })
 .catch(() => {
 /* non-critical */
 })
 .finally(() => {
 if (!cancelled) setLoading(false);
 });
 return () => {
 cancelled = true;
 };
 }, []);

 useRealtimeEvent("message.new", reloadConversations);

 useEffect(() => {
 const onVis = () => {
 if (document.visibilityState === "visible") reloadConversations();
 };
 document.addEventListener("visibilitychange", onVis);
 return () => document.removeEventListener("visibilitychange", onVis);
 }, [reloadConversations]);

 /** Profile / deep-link: `/messages?userId=` or legacy `?user=` (username) → open or create DM. */
 useEffect(() => {
 if (!userIdQ && !usernameQ) {
 setOpeningChat(false);
 return;
 }

 if (!user?.id) {
 toast.error("Sign in to send messages");
 router.replace("/messages");
 setOpeningChat(false);
 return;
 }

 let cancelled = false;
 setOpeningChat(true);

 (async () => {
 let peerId: number | null = null;
 if (userIdQ) {
 const n = Number(userIdQ);
 peerId = Number.isFinite(n) ? n : null;
 } else if (usernameQ) {
 try {
 const u = await usersApi.getUser(usernameQ);
 peerId = Number(u.id);
 } catch {
 if (!cancelled) {
 toast.error("Could not load that user");
 router.replace("/messages");
 }
 setOpeningChat(false);
 return;
 }
 }

 if (peerId === null || !Number.isFinite(peerId) || peerId === Number(user.id)) {
 if (!cancelled) router.replace("/messages");
 setOpeningChat(false);
 return;
 }

 try {
 const conv = await messagesApi.createConversation(peerId);
 if (cancelled) return;
 router.replace(`/messages/${conv.id}`);
 } catch (err) {
 if (cancelled) return;
 const msg =
 err instanceof ApiError
 ? err.message
 : err instanceof Error
 ? err.message
 : "Could not open chat";
 toast.error(msg);
 router.replace("/messages");
 } finally {
 if (!cancelled) setOpeningChat(false);
 }
 })();

 return () => {
 cancelled = true;
 };
 }, [userIdQ, usernameQ, user?.id, router]);

 const filtered = search
 ? conversations.filter((c) => {
 const title = resolveConversationTitle(c, user?.id);
 const peer = getDirectChatPeer(c, user?.id);
 const hay = `${title} ${peer?.username ?? ""}`.toLowerCase();
 return hay.includes(search.toLowerCase());
 })
 : conversations;

 if (openingChat) {
 return (
 <PageContainer size="sm" className="py-4">
 <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
 <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
 <p className="text-sm font-medium text-muted-foreground">{t("openingChat")}</p>
 </div>
 </PageContainer>
 );
 }

 return (
 <PageContainer size="sm" className="py-4">
 <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
 <h1 className="text-2xl font-bold sm:text-[28px]">
 {t("title")}
 </h1>
 <div className="flex flex-wrap gap-2">
 <Button variant="outline" size="sm" asChild className="gap-1.5">
 <Link href="/messages/broadcasts"><Megaphone className="h-3.5 w-3.5" /> Broadcasts</Link>
 </Button>
 <Button
 variant="outline"
 size="sm"
 className="gap-1.5"
 onClick={() => setGroupDialogOpen(true)}
 >
 <Users className="h-3.5 w-3.5" /> New Group
 </Button>
 </div>
 </div>

 <CreateGroupChatDialog
 open={groupDialogOpen}
 onClose={() => setGroupDialogOpen(false)}
 onCreated={(conv) => router.push(`/messages/${conv.id}`)}
 />

 {/* Search conversations */}
 <div className="relative mb-4">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
 <Input
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder={t("searchConversationsPlaceholder")}
 className="pl-9"
 aria-label={t("searchConversationsPlaceholder")}
 />
 </div>

 {loading ? (
 <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
 ) : (
 <div className="space-y-2">
 {filtered.map((conv) => {
 const peer = getDirectChatPeer(conv, user?.id);
 const rowTitle = resolveConversationTitle(conv, user?.id);
 return (
 <Link
 key={conv.id}
 data-testid="conversation-item"
 href={`/messages/${conv.id}`}
 className="flex items-center gap-3 px-3 py-3 hover:bg-muted/50 transition-colors"
 >
 <Avatar className="h-12 w-12">
 <AvatarImage src={conv.avatar ?? peer?.avatar} />
 <AvatarFallback>{(rowTitle.trim().charAt(0) || "?").toUpperCase()}</AvatarFallback>
 </Avatar>
 <div className="min-w-0 flex-1">
 <div className="flex items-center justify-between gap-2">
 <div className="flex min-w-0 items-center gap-1.5">
 <p className="truncate text-[15px] font-semibold">
 {rowTitle}
 </p>
 {conv.type === "group" && <Badge variant="secondary" className="text-[10px]">Group</Badge>}
 {conv.pinned && <Pin className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Pinned" />}
 {conv.muted && <BellOff className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Muted" />}
 </div>
 {conv.unread_count > 0 && (
 <Badge variant={conv.muted ? "secondary" : "destructive"} className="text-xs">
 {conv.unread_count}
 </Badge>
 )}
 </div>
 <p className="truncate text-[13px] text-muted-foreground">
 {conv.last_message?.content}
 </p>
 </div>
 </Link>
 );
 })}
 {filtered.length === 0 && !search && (
 <EmptyState icon={MessageCircle} title={t("noConversations")} description={t("newMessage")} />
 )}
 {filtered.length === 0 && search && (
 <p className="py-8 text-center text-sm font-medium text-muted-foreground">
 {t("noConversationSearchResults", { query: search })}
 </p>
 )}
 </div>
 )}
 </PageContainer>
 );
}
