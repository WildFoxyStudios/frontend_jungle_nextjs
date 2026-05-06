"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useFeed, useIntersection } from "@jungle/hooks";
import type { Post } from "@jungle/api-client";
import { Skeleton, PageContainer } from "@jungle/ui";
import { PostCard } from "@/components/feed/PostCard";
import { PostComposer } from "@/components/feed/PostComposer";
import { StoryRing } from "@/components/stories/StoryRing";
import { NewPostsBanner } from "@/components/feed/NewPostsBanner";
import { firstHeroImagePostId } from "@/lib/feed-lcp";

export default function FeedPage() {
 const pathname = usePathname();
 const isFeedRoute = pathname === "/feed";

 const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useFeed({
 type: "all",
 });
 const [sentinelRef, isIntersecting] = useIntersection({ threshold: 0, rootMargin: "200px" });
 const [localPosts, setLocalPosts] = useState<Post[]>([]);

 useEffect(() => {
 if (isIntersecting && hasNextPage && !isFetchingNextPage) {
 fetchNextPage();
 }
 }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

 const feedPosts = useMemo(
 () => data?.pages.flatMap((p: { data: Post[] }) => p.data) ?? [],
 [data?.pages],
 );

 const uniquePosts = useMemo(() => {
 const seen = new Set<number>();
 const out: Post[] = [];
 for (const p of [...localPosts, ...feedPosts]) {
 if (!seen.has(p.id)) {
 seen.add(p.id);
 out.push(p);
 }
 }
 return out;
 }, [localPosts, feedPosts]);

 const lcpImagePostId = firstHeroImagePostId(uniquePosts);

 const postIdsSig = useMemo(() => uniquePosts.map((p) => p.id).join(","), [uniquePosts]);
 const uniquePostsRef = useRef(uniquePosts);
 uniquePostsRef.current = uniquePosts;

 const [kbdIdx, setKbdIdx] = useState(0);
 const kbdIdxRef = useRef(0);
 kbdIdxRef.current = kbdIdx;

 useEffect(() => {
 setLocalPosts([]);
 setKbdIdx(0);
 kbdIdxRef.current = 0;
 }, []);

 useEffect(() => {
 setKbdIdx((i) => {
 const n = uniquePostsRef.current.length;
 if (n === 0) {
 kbdIdxRef.current = 0;
 return 0;
 }
 const next = Math.min(Math.max(0, i), n - 1);
 kbdIdxRef.current = next;
 return next;
 });
 }, [postIdsSig, uniquePosts.length]);

 useEffect(() => {
 if (!isFeedRoute) return;

 const isEditable = (el: EventTarget | null): boolean => {
 if (!(el instanceof HTMLElement)) return false;
 const tag = el.tagName;
 return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
 };

 const onKeyDown = (e: KeyboardEvent) => {
 if (!isFeedRoute || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.repeat) return;
 if (isEditable(e.target)) return;

 const list = uniquePostsRef.current;
 const n = list.length;
 if (n === 0) return;

 const idx = kbdIdxRef.current;
 const focusedId = list[idx]?.id;
 if (focusedId === undefined) return;

 const dispatch = (action: string) =>
 window.dispatchEvent(
 new CustomEvent("wowonder-feed-kbd", { detail: { action, postId: focusedId } }),
 );

 switch (e.code) {
 case "KeyJ": {
 e.preventDefault();
 setKbdIdx((i) => {
 const next = Math.min(i + 1, n - 1);
 kbdIdxRef.current = next;
 return next;
 });
 break;
 }
 case "KeyK": {
 e.preventDefault();
 setKbdIdx((i) => {
 const next = Math.max(i - 1, 0);
 kbdIdxRef.current = next;
 return next;
 });
 break;
 }
 case "KeyL":
 e.preventDefault();
 dispatch("like");
 break;
 case "KeyC":
 e.preventDefault();
 dispatch("comment");
 break;
 case "KeyS":
 e.preventDefault();
 dispatch("share");
 break;
 default:
 break;
 }
 };

 window.addEventListener("keydown", onKeyDown);
 return () => window.removeEventListener("keydown", onKeyDown);
 }, [isFeedRoute]);

 useEffect(() => {
 const id = uniquePosts[kbdIdx]?.id;
 if (id === undefined || !isFeedRoute) return;
 const el = document.querySelector<HTMLElement>(`[data-feed-post-id="${id}"]`);
 el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
	// eslint-disable-next-line react-hooks/exhaustive-deps
   }, [kbdIdx, isFeedRoute, postIdsSig]);

 const handleNewPost = useCallback((post: Post) => {
 setLocalPosts((prev) => [post, ...prev]);
 }, []);

 const handleDeletePost = useCallback((postId: number) => {
 setLocalPosts((prev) => prev.filter((p) => p.id !== postId));
 }, []);

 const handleRefresh = () => {
 setLocalPosts([]);
 refetch();
 };

 return (
 <PageContainer size="sm" className="space-y-4 py-4 sm:py-4">
 <StoryRing />

 <NewPostsBanner scope="home" onRefresh={handleRefresh} />

 <PostComposer onSuccess={handleNewPost} />

 {uniquePosts.map((post: Post, idx: number) => (
 <PostCard
 key={post.id}
 post={post}
 onDelete={handleDeletePost}
 priority={lcpImagePostId !== null && post.id === lcpImagePostId}
 keyboardFocused={isFeedRoute && idx === kbdIdx}
 />
 ))}

 {isFetchingNextPage && (
 <div className="space-y-4">
 {[1, 2].map((i) => (
 <Skeleton key={i} className="h-48 w-full" />
 ))}
 </div>
 )}

 <div ref={sentinelRef} className="h-1" />
 </PageContainer>
 );
}
