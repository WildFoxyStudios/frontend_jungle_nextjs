"use client";

import { useEffect, useState } from "react";
import { postsApi } from "@jungle/api-client";
import type { Post } from "@jungle/api-client";
import { PostCard } from "@/components/feed/PostCard";
import { firstHeroImagePostId } from "@/lib/feed-lcp";
import { Skeleton } from "@jungle/ui";

export default function BoostedPostsPage() {
 const [posts, setPosts] = useState<Post[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 postsApi.getBoostedPosts()
 .then((r) => setPosts(r.data))
 .catch(() => { /* non-critical: failure is silent */ })
 .finally(() => setLoading(false));
 }, []);

 const lcpPostId = firstHeroImagePostId(posts);

 return (
 <div className="mx-auto max-w-2xl space-y-4 px-3 py-4 sm:px-4">
 <h1 className="text-2xl font-bold sm:text-[28px]">Boosted Posts</h1>
 {loading && [1, 2].map((i) => <Skeleton key={i} className="h-48 w-full" />)}
 {!loading && posts.length === 0 && (
 <div className="py-12 text-center">
 <p className="text-[15px] font-semibold text-muted-foreground">
 No boosted posts. Boost a post to promote it to more people.
 </p>
 </div>
 )}
 {posts.map((post) => (
 <PostCard key={post.id} post={post} priority={lcpPostId !== null && post.id === lcpPostId} />
 ))}
 </div>
 );
}
