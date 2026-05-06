"use client";

import { useEffect, useState } from "react";
import { postsApi } from "@jungle/api-client";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 Skeleton,
 Avatar,
 AvatarFallback,
 AvatarImage,
 Button,
 ScrollArea,
} from "@jungle/ui";
import { toast } from "sonner";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { resolveAvatarUrl } from "@/lib/avatar";

interface ViewersLightboxProps {
 postId: number;
 totalHint?: number;
 open: boolean;
 onClose: () => void;
}

type ViewerRow = {
 id: number;
 user_id: number;
 username: string;
 first_name: string;
 last_name: string;
 avatar: string;
 viewed_at: string;
};

/**
 * Plan §3.18 SA7 — lightbox showing the individual users who viewed a post.
 * Only the post author has permission to see this list (backend enforces
 * the 403 when a different user opens it). Callers should therefore hide
 * the trigger for non-authors on the client as a UX nicety.
 */
export function ViewersLightbox({
 postId,
 totalHint,
 open,
 onClose,
}: ViewersLightboxProps) {
 const [rows, setRows] = useState<ViewerRow[]>([]);
 const [cursor, setCursor] = useState<number | null>(null);
 const [total, setTotal] = useState<number>(totalHint ?? 0);
 const [loading, setLoading] = useState(false);
 const [loadingMore, setLoadingMore] = useState(false);
 const [forbidden, setForbidden] = useState(false);

 const load = async (nextCursor?: number) => {
 if (nextCursor === undefined) {
 setLoading(true);
 } else {
 setLoadingMore(true);
 }
 try {
 const res = await postsApi.getPostViewers(postId, nextCursor);
 if (nextCursor === undefined) {
 setRows(res.viewers);
 } else {
 setRows((prev) => [...prev, ...res.viewers]);
 }
 setTotal(res.total);
 setCursor(res.cursor);
 } catch (err) {
 const status = (err as { status?: number })?.status;
 if (status === 403) {
 setForbidden(true);
 } else {
 toast.error("Failed to load viewers");
 }
 } finally {
 setLoading(false);
 setLoadingMore(false);
 }
 };

 useEffect(() => {
 if (!open) return;
 setForbidden(false);
 setRows([]);
 setCursor(null);
 void load();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [open, postId]);

 return (
 <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
 <DialogContent className="sm:max-w-md">
 <DialogHeader>
 <DialogTitle>
 {total > 0 ? `${total.toLocaleString()} viewers` : "Viewers"}
 </DialogTitle>
 </DialogHeader>

 {forbidden ? (
 <p className="text-sm text-muted-foreground">
 Only the post author can see who viewed this post.
 </p>
 ) : loading ? (
 <div className="space-y-3">
 {Array.from({ length: 5 }).map((_, i) => (
 <div key={i} className="flex items-center gap-3">
 <Skeleton className="h-10 w-10 rounded-full" />
 <div className="space-y-1 flex-1">
 <Skeleton className="h-3 w-24" />
 <Skeleton className="h-3 w-16" />
 </div>
 </div>
 ))}
 </div>
 ) : rows.length === 0 ? (
 <p className="text-sm text-muted-foreground">
 No one has seen this post yet.
 </p>
 ) : (
 <ScrollArea className="max-h-96">
 <ul className="space-y-1">
 {rows.map((v) => (
 <li key={v.id}>
 <Link
 href={`/profile/${v.username}`}
 onClick={onClose}
 className="flex items-center gap-3 border-2 border-transparent p-2 hover:border-foreground hover:bg-secondary/60"
 >
 <Avatar className="h-10 w-10">
 <AvatarImage src={resolveAvatarUrl(v.avatar)} />
 <AvatarFallback>
 {v.first_name?.[0] ?? v.username[0]}
 </AvatarFallback>
 </Avatar>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium truncate">
 {v.first_name} {v.last_name}
 </p>
 <p className="text-xs text-muted-foreground truncate">
 @{v.username} ·{" "}
 {formatDistanceToNow(new Date(v.viewed_at), {
 addSuffix: true,
 })}
 </p>
 </div>
 </Link>
 </li>
 ))}
 </ul>
 {cursor !== null && (
 <div className="pt-2 flex justify-center">
 <Button
 variant="ghost"
 size="sm"
 onClick={() => load(cursor)}
 disabled={loadingMore}
 >
 {loadingMore ? "Loading…" : "Load more"}
 </Button>
 </div>
 )}
 </ScrollArea>
 )}
 </DialogContent>
 </Dialog>
 );
}
