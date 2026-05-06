"use client";

import { useState } from "react";
import Link from "next/link";
import { pagesApi } from "@jungle/api-client";
import type { Page } from "@jungle/api-client";
import {
 HoverCard,
 HoverCardContent,
 HoverCardTrigger,
 Avatar,
 AvatarFallback,
 AvatarImage,
 Button,
 Badge,
} from "@jungle/ui";
import { BadgeCheck, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface PageHoverCardProps {
 /** Slug the backend accepts on `GET /v1/pages/{slug}`. */
 slug: string;
 children: React.ReactNode;
}

/**
 * Plan §3.16 HC2 — hoverable card for a page: cover, name, verified
 * badge, category, like count and a like/unlike toggle.
 */
export function PageHoverCard({ slug, children }: PageHoverCardProps) {
 const [page, setPage] = useState<Page | null>(null);
 const [loading, setLoading] = useState(false);
 const [fetched, setFetched] = useState(false);
 const [liked, setLiked] = useState(false);
 const [likeCount, setLikeCount] = useState(0);
 const t = useTranslations("common");

 const handleOpen = (open: boolean) => {
 if (!open || fetched || !slug || slug === "undefined") return;
 setLoading(true);
 setFetched(true);
 pagesApi
 .getPage(slug)
 .then((p) => {
 setPage(p);
 // `is_liked` / `like_count` live on the backend Page row but the
 // TS type doesn't expose all optional fields; read defensively.
 setLiked(Boolean((p as Page & { is_liked?: boolean }).is_liked));
 setLikeCount((p as Page & { like_count?: number }).like_count ?? 0);
 })
 .catch((err) => { console.error("[PageHoverCard] fetch failed", err); })
 .finally(() => setLoading(false));
 };

 const handleToggle = async () => {
 if (!page) return;
 try {
 if (liked) {
 await pagesApi.unlikePage(page.id);
 setLiked(false);
 setLikeCount((c) => Math.max(0, c - 1));
 } else {
 await pagesApi.likePage(page.id);
 setLiked(true);
 setLikeCount((c) => c + 1);
 }
 } catch {
 toast.error("Action failed");
 }
 };

 return (
 <HoverCard onOpenChange={handleOpen} openDelay={300} closeDelay={200}>
 <HoverCardTrigger asChild>{children}</HoverCardTrigger>
 <HoverCardContent className="w-72 p-0 overflow-hidden" side="bottom" align="start">
 {loading ? (
 <div className="h-20 flex items-center justify-center text-sm text-muted-foreground">
 {t("loading")}
 </div>
 ) : !page ? null : (
 <div>
 {page.cover && (
 // eslint-disable-next-line @next/next/no-img-element
 <img src={page.cover} alt="" className="h-20 w-full object-cover" />
 )}
 <div className="p-4 space-y-3">
 <div className="flex items-start gap-3">
 <Avatar className="h-12 w-12 border-2 border-background">
 <AvatarImage src={page.avatar} />
 <AvatarFallback>{page.name?.[0]?.toUpperCase()}</AvatarFallback>
 </Avatar>
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-1">
 <p className="font-semibold text-sm truncate">{page.name}</p>
 {page.is_verified && (
 <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />
 )}
 </div>
 {page.category && (
 <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 mt-1">
 {page.category}
 </Badge>
 )}
 </div>
 </div>

 {page.description && (
 <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
 {page.description}
 </p>
 )}

 <div className="flex items-center gap-2 text-xs text-muted-foreground">
 <ThumbsUp className="h-3.5 w-3.5" />
 <span>
 <strong className="text-foreground">
 {likeCount.toLocaleString()}
 </strong>{" "}
 likes
 </span>
 </div>

 <div className="flex gap-2 pt-1">
 <Button
 size="sm"
 className="h-9 flex-1 rounded-full text-[13px] font-semibold"
 onClick={handleToggle}
 >
 {liked ? "Unlike" : "Like"}
 </Button>
 <Button
 size="sm"
 variant="outline"
 className="h-9 flex-1 rounded-full text-[13px] font-semibold"
 asChild
 >
 <Link href={`/pages/${page.name ?? slug}`}>Visit</Link>
 </Button>
 </div>
 </div>
 </div>
 )}
 </HoverCardContent>
 </HoverCard>
 );
}
