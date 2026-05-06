"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { LiveStream } from "@jungle/api-client";
import { liveApi } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import { Avatar, AvatarFallback, AvatarImage, Badge, Button, Card, CardContent, Input } from "@jungle/ui";
import { Radio, Users, ArrowLeft, Heart, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { LiveVideoErrorBoundary } from "./LiveVideoErrorBoundary";
import { resolveAvatarUrl } from "@/lib/avatar";

const MillicastBroadcaster = dynamic(
 () => import("./MillicastBroadcaster").then((m) => ({ default: m.MillicastBroadcaster })),
 {
 ssr: false,
 loading: () => (
 <div className="aspect-video animate-pulse bg-muted" />
 ),
 },
);

const MillicastViewer = dynamic(
 () => import("./MillicastViewer").then((m) => ({ default: m.MillicastViewer })),
 {
 ssr: false,
 loading: () => (
 <div className="aspect-video animate-pulse bg-muted" />
 ),
 },
);

type ChatLine = { id: string; text: string; mine: boolean };

function displayName(pub: LiveStream["publisher"]): string {
 if (!pub) return "Host";
 const n = `${pub.first_name ?? ""} ${pub.last_name ?? ""}`.trim();
 if (n) return n;
 return pub.username ?? "Host";
}

export function LiveStreamRoom({ streamId }: { streamId: number }) {
 const router = useRouter();
 const searchParams = useSearchParams();
 const { user } = useAuthStore();
 const t = useTranslations("liveRoom");
 const [stream, setStream] = useState<LiveStream | null>(null);
 const [vod, setVod] = useState<Awaited<ReturnType<typeof liveApi.getLiveVod>>>(null);
 const [loadError, setLoadError] = useState<string | null>(null);
 const [chat, setChat] = useState<ChatLine[]>([]);
 const [chatInput, setChatInput] = useState("");

 const wantsHost = searchParams.get("host") === "1";
 const isOwner = useMemo(
 () => !!user && !!stream && Number(user.id) === Number(stream.user_id),
 [user, stream],
 );
 const isHostUi = wantsHost && isOwner;

 const load = useCallback(async () => {
 try {
 const s = await liveApi.getLiveStream(streamId);
 setStream(s);
 setLoadError(null);
 if (s.status === "ended") {
 const v = await liveApi.getLiveVod(streamId);
 setVod(v);
 } else {
 setVod(null);
 }
 } catch (e) {
 setLoadError(e instanceof Error ? e.message : t("loadError"));
 setStream(null);
 }
 }, [streamId, t]);

 useEffect(() => {
 void load();
 const id = window.setInterval(() => void load(), 8000);
 return () => window.clearInterval(id);
 }, [load]);

 const sendChat = async () => {
 const text = chatInput.trim();
 if (!text) return;
 try {
 await liveApi.commentOnLive(streamId, text);
 setChat((c) => [...c, { id: `${Date.now()}`, text, mine: true }]);
 setChatInput("");
 toast.success(t("chatSent"));
 } catch {
 toast.error(t("chatError"));
 }
 };

 const sendHeart = async () => {
 try {
 await liveApi.reactToLive(streamId, "love");
 toast.success("❤️");
 } catch {
 toast.error(t("reactionError"));
 }
 };

 const endStream = async () => {
 try {
 await liveApi.stopLive();
 toast.success(t("stopStream"));
 router.push("/live");
 } catch {
 toast.error(t("stopError"));
 }
 };

 if (loadError) {
 return (
 <div className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center">
 <p className="text-lg font-semibold">{loadError}</p>
 <Button asChild variant="outline">
 <Link href="/live">{t("pageTitle")}</Link>
 </Button>
 </div>
 );
 }

 if (!stream) {
 return (
 <div className="mx-auto max-w-lg px-4 py-16 text-center text-muted-foreground">
 {t("connecting")}
 </div>
 );
 }

 if (stream.status === "ended") {
 return (
 <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
 <Button variant="ghost" size="sm" asChild className="gap-2">
 <Link href="/live">
 <ArrowLeft className="h-4 w-4" /> {t("pageTitle")}
 </Link>
 </Button>
 <div className="space-y-2 p-6">
 <h1 className="text-xl font-semibold">{stream.title}</h1>
 <p className="text-sm text-muted-foreground">{t("streamEnded")}</p>
 <p className="text-sm text-muted-foreground">{t("vodHint")}</p>
 {vod?.vod_url && (
 <Button asChild className="mt-2">
 <a href={vod.vod_url} target="_blank" rel="noopener noreferrer">
 {t("openVod")}
 </a>
 </Button>
 )}
 </div>
 </div>
 );
 }

 const pub = stream.publisher;

 return (
 <div className="mx-auto max-w-4xl space-y-4 px-4 py-4">
 <div className="flex flex-wrap items-center gap-3">
 <Button variant="ghost" size="icon" asChild>
 <Link href="/live">
 <ArrowLeft className="h-5 w-5" />
 </Link>
 </Button>
 <div className="flex min-w-0 flex-1 items-center gap-3">
 <Badge variant="destructive" className="shrink-0 gap-1">
 <Radio className="h-3 w-3" /> {t("liveBadge")}
 </Badge>
 <div className="min-w-0">
 <h1 className="truncate text-lg font-semibold sm:text-xl">{stream.title}</h1>
 <div className="mt-1 flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
 <Users className="h-3.5 w-3.5" />
 {stream.viewer_count} {t("viewers")}
 </div>
 </div>
 </div>
 {isHostUi && (
 <Button variant="destructive" size="sm" onClick={() => void endStream()}>
 {t("stopStream")}
 </Button>
 )}
 </div>

 <div className="flex flex-wrap items-center gap-3 bg-muted/40 p-3">
 <Avatar className="h-11 w-11 border">
 <AvatarImage src={pub ? resolveAvatarUrl(pub.avatar) : undefined} alt={displayName(pub)} />
 <AvatarFallback>{displayName(pub).slice(0, 1)}</AvatarFallback>
 </Avatar>
 <div className="min-w-0 flex-1">
 <p className="truncate font-semibold">{displayName(pub)}</p>
 {pub?.username && (
 <Link href={`/profile/${pub.username}`} className="text-[13px] font-medium text-primary hover:underline">
 @{pub.username}
 </Link>
 )}
 </div>
 {isHostUi && <Badge variant="outline">{t("hostBadge")}</Badge>}
 </div>

 <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
 <div className="space-y-2">
 <LiveVideoErrorBoundary
 key={streamId}
 fallback={
 <div className="flex aspect-video items-center justify-center p-4 text-center text-[15px] font-semibold text-muted-foreground">
 {t("millicastError")}
 </div>
 }
 >
 {isHostUi ? (
 <MillicastBroadcaster streamName={stream.stream_key} className="" />
 ) : (
 <MillicastViewer streamName={stream.stream_key} className="" />
 )}
 </LiveVideoErrorBoundary>
 <p className="text-xs text-muted-foreground">{t("streamKeyHelp")}</p>
 <code className="block select-all break-all border bg-muted px-2 py-1 font-mono text-xs">
 {stream.stream_key}
 </code>
 </div>

 <Card className="border">
 <CardContent className="space-y-3 p-3">
 <div className="flex items-center justify-between gap-2">
 <span className="flex items-center gap-1 text-xs font-black">
 <MessageCircle className="h-4 w-4" /> Chat
 </span>
 <Button type="button" size="sm" variant="secondary" className="gap-1" onClick={() => void sendHeart()}>
 <Heart className="h-4 w-4" />
 </Button>
 </div>
 <div className="max-h-48 space-y-1 overflow-y-auto text-sm">
 {chat.length === 0 ? (
 <p className="text-xs text-muted-foreground">{t("chatPlaceholder")}</p>
 ) : (
 chat.map((line) => (
 <p key={line.id} className={line.mine ? "text-right font-semibold text-primary" : ""}>
 {line.text}
 </p>
 ))
 )}
 </div>
 <div className="flex gap-2">
 <Input
 value={chatInput}
 onChange={(e) => setChatInput(e.target.value)}
 placeholder={t("chatPlaceholder")}
 onKeyDown={(e) => {
 if (e.key === "Enter") void sendChat();
 }}
 />
 <Button type="button" onClick={() => void sendChat()}>
 {t("sendChat")}
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 );
}
