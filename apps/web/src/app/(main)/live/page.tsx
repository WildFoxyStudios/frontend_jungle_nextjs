"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LiveStream, PaginatedResponse } from "@jungle/api-client";
import { liveApi, liveNativeApi } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import {
 Button,
 Card,
 CardContent,
 Dialog,
 DialogContent,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 Input,
 Label,
 Skeleton,
 Badge,
} from "@jungle/ui";
import { Radio, Users, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "@/lib/date";

function hostLabel(s: LiveStream, fallback: string): string {
 const p = s.publisher;
 if (!p) return fallback;
 const n = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
 if (n) return n;
 return p.username ?? fallback;
}

export default function LiveListPage() {
 const router = useRouter();
 const { accessToken, user } = useAuthStore();
 const t = useTranslations("liveRoom");
 const tc = useTranslations("common");
 const [streams, setStreams] = useState<LiveStream[]>([]);
 const [loading, setLoading] = useState(true);
 const [showStart, setShowStart] = useState(false);
 const [title, setTitle] = useState("");
 const [starting, setStarting] = useState(false);
 const [myLiveId, setMyLiveId] = useState<number | null>(null);

 const load = useCallback(async () => {
 if (!accessToken) {
 setStreams([]);
 setLoading(false);
 return;
 }
 setLoading(true);
 try {
 const res = await liveApi.getActiveLives();
 const body = res as PaginatedResponse<LiveStream>;
 const list = Array.isArray(body?.data) ? body.data : [];
 setStreams(list);
 const mine = list.find((s) => user && Number(s.user_id) === Number(user.id));
 setMyLiveId(mine ? mine.id : null);
 } catch {
 toast.error(t("loadError"));
 setStreams([]);
 } finally {
 setLoading(false);
 }
 }, [accessToken, user, t]);

 useEffect(() => {
 void load();
 }, [load]);

 const handleStart = async () => {
 if (!title.trim()) {
 toast.error(t("streamTitlePlaceholder"));
 return;
 }
 setStarting(true);
 try {
 // Default flow: use the internal live-service (self-hosted WebRTC).
 const room = await liveNativeApi.createRoom({
 title: title.trim(),
 kind: "live",
 max_participants: 100,
 });
 // Close dialog and navigate only on success
 setShowStart(false);
 setTitle("");
 toast.success(t("goLive"));
 router.push(`/live/${room.id}?host=1`);
 } catch (err) {
 // Log to console so devs can see the actual API error in DevTools
 console.error("[Go Live] createRoom error:", err);
 const msg =
 err instanceof Error
 ? err.message
 : typeof err === "string"
 ? err
 : t("startError");
 toast.error(msg);
 // Keep dialog open so the user can retry
 } finally {
 setStarting(false);
 }
 };

 const handleStopMine = async () => {
 try {
 await liveApi.stopLive();
 toast.success(t("stopStream"));
 setMyLiveId(null);
 void load();
 } catch {
 toast.error(t("stopError"));
 }
 };

 if (!accessToken) {
 return (
 <div className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center">
 <Radio className="mx-auto h-12 w-12 text-muted-foreground" />
 <p className="font-semibold">{t("signInToWatch")}</p>
 <Button asChild>
 <Link href="/login">{t("signInToWatch")}</Link>
 </Button>
 </div>
 );
 }

 return (
 <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-[28px]">
 <Radio className="h-6 w-6 text-red-500" /> {t("pageTitle")}
 </h1>
 <div className="flex flex-wrap items-center gap-2">
 <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void load()}>
 <RefreshCw className="h-4 w-4" /> {t("refresh")}
 </Button>
 {myLiveId ? (
 <>
 <Button variant="destructive" size="sm" className="gap-2" onClick={() => void handleStopMine()}>
 <Radio className="h-4 w-4" /> {t("stopStream")}
 </Button>
 <Button size="sm" asChild className="gap-2">
 <Link href={`/live/${myLiveId}?host=1`}>
 <Play className="h-4 w-4" /> {t("yourStream")}
 </Link>
 </Button>
 </>
 ) : (
 <Button type="button" size="sm" onClick={() => setShowStart(true)} className="gap-2">
 <Radio className="h-4 w-4" /> {t("goLive")}
 </Button>
 )}
 </div>
 </div>

 <p className="text-sm text-muted-foreground">{t("startHint")}</p>

 {loading ? (
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 {[1, 2, 3, 4].map((i) => (
 <Skeleton key={i} className="h-40 w-full" />
 ))}
 </div>
 ) : streams.length === 0 ? (
 <div className="space-y-2 py-12 text-center">
 <Radio className="mx-auto h-10 w-10 text-muted-foreground" />
 <p className="font-medium text-muted-foreground">{t("noStreams")}</p>
 <p className="text-sm text-muted-foreground">{t("noStreamsHint")}</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 {streams.map((s) => (
 <Link key={s.id} href={`/live/${s.id}`}>
 <Card className="group h-full cursor-pointer overflow-hidden transition hover:bg-muted/50">
 <div className="relative flex aspect-video items-center justify-center border-b bg-gradient-to-br from-gray-800 to-gray-900">
 <Play className="h-12 w-12 text-white/40 transition-colors group-hover:text-white/70" />
 <Badge variant="destructive" className="absolute left-2 top-2 gap-1">
 <Radio className="h-3 w-3" /> {t("liveBadge")}
 </Badge>
									 <Badge variant="secondary" className="absolute bottom-2 right-2 gap-1 border-white/70 bg-black/70 text-white">
									 <Users className="h-3 w-3" />
									 {s.viewer_count}
									 </Badge>
 </div>
 <CardContent className="space-y-1 p-3">
 <p className="line-clamp-1 text-sm font-semibold">{s.title}</p>
 <p className="text-[13px] font-medium text-muted-foreground">{hostLabel(s, t("hostBadge"))}</p>
 <p className="text-[13px] font-medium text-muted-foreground">
 {formatDistanceToNow(s.created_at)}
 </p>
 </CardContent>
 </Card>
 </Link>
 ))}
 </div>
 )}

 <Dialog open={showStart} onOpenChange={setShowStart}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2">
 <Radio className="h-5 w-5 text-red-500" /> {t("startTitle")}
 </DialogTitle>
 </DialogHeader>
 <div className="space-y-4 py-2">
 <div className="space-y-1.5">
 <Label>{t("streamTitleLabel")}</Label>
 <Input
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder={t("streamTitlePlaceholder")}
 maxLength={100}
 onKeyDown={(e) => {
 if (e.key === "Enter") void handleStart();
 }}
 />
 </div>
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => setShowStart(false)}>
 {tc("cancel")}
 </Button>
 <Button onClick={() => void handleStart()} disabled={starting || !title.trim()} className="gap-2">
 <Radio className="h-4 w-4" />
 {starting ? t("connecting") : t("goLive")}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 );
}
