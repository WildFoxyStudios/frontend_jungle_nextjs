"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import type { Post } from "@jungle/api-client";
import { useExploreFeed, useIntersection, usePublicConfig } from "@jungle/hooks";
import { PageContainer, Skeleton } from "@jungle/ui";
import { PostCard } from "@/components/feed/PostCard";
import { firstHeroImagePostId } from "@/lib/feed-lcp";
import { EmptyState } from "@/components/shared/EmptyState";
import { Compass, Image as ImageIcon, Film } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ExplorePage() {
 const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useExploreFeed();
 const [sentinelRef, isIntersecting] = useIntersection({ threshold: 0, rootMargin: "200px" });
 const { websiteMode } = usePublicConfig();
 const t = useTranslations("nav");
 const tc = useTranslations("common");

 useEffect(() => {
 if (isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
 }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

 const posts = useMemo(() => {
 const flat = data?.pages.flatMap((p: { data: Post[] }) => p.data) ?? [];
 const seen = new Set<number>();
 return flat.filter((p) => {
 if (seen.has(p.id)) return false;
 seen.add(p.id);
 return true;
 });
 }, [data]);

 if (websiteMode === "instagram") {
 const visualPosts = posts.filter((p: Post) =>
 (p.media ?? []).some((m) => m.type === "image" || m.type === "video"),
 );
 return (
 <PageContainer size="full" className="max-w-5xl px-2 py-4 sm:px-3">
 <h1 className="mb-3 px-2 text-2xl font-bold sm:text-[28px]">
 {t("explore")}
 </h1>
 {isLoading ? (
 <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
 {Array.from({ length: 9 }).map((_, i) => (
 <Skeleton key={i} className="aspect-square w-full" />
 ))}
 </div>
 ) : visualPosts.length === 0 ? (
 <EmptyState icon={Compass} title={tc("noResults")} description={tc("retry")} />
 ) : (
 <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
 {(() => {
 const lcpId = firstHeroImagePostId(visualPosts);
 return visualPosts.map((p: Post) => {
 const cover = p.media?.find((m) => m.type === "image") ?? p.media?.[0];
 const isVideo = cover?.type === "video";
 const isLcpCell = lcpId !== null && p.id === lcpId && !isVideo && !!cover?.url;
 return (
 <Link
 key={p.id}
 href={`/post/${p.id}`}
 className="group relative block aspect-square overflow-hidden bg-muted transition-colors hover:brightness-95"
 >
 {cover?.url && !isVideo ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={cover.url}
 alt=""
 className="h-full w-full object-cover transition-transform group-hover:scale-105"
 loading={isLcpCell ? "eager" : "lazy"}
 fetchPriority={isLcpCell ? "high" : "low"}
 />
 ) : isVideo && cover?.url ? (
 <video
 src={cover.url}
 muted
 playsInline
 className="h-full w-full object-cover"
 />
 ) : (
 <div className="flex h-full w-full items-center justify-center text-muted-foreground">
 <ImageIcon className="h-8 w-8" />
 </div>
 )}
 {isVideo && (
 <span className="absolute right-2 top-2 border bg-background p-1">
 <Film className="h-3.5 w-3.5 text-foreground" />
 </span>
 )}
 </Link>
 );
 });
 })()}
 </div>
 )}
 <div ref={sentinelRef} className="h-1" />
 </PageContainer>
 );
 }

 return (
 <PageContainer size="sm" className="space-y-4 py-4">
 <h1 className="text-2xl font-bold sm:text-[28px]">
 {t("explore")}
 </h1>
 {isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full" />)}
 {(() => {
 const lcpId = firstHeroImagePostId(posts);
 return posts.map((post: Post) => (
 <PostCard key={post.id} post={post} priority={lcpId !== null && post.id === lcpId} />
 ));
 })()}
 {isFetchingNextPage && <Skeleton className="h-48 w-full" />}
 {!isLoading && posts.length === 0 && (
 <EmptyState icon={Compass} title={tc("noResults")} description={tc("retry")} />
 )}
 <div ref={sentinelRef} className="h-1" />
 </PageContainer>
 );
}
