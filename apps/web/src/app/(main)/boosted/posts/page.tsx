"use client";

import { useEffect, useState } from "react";
import { postsApi } from "@jungle/api-client";
import type { Post } from "@jungle/api-client";
import { PostCard } from "@/components/feed/PostCard";
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold">Boosted Posts</h1>
      {loading && [1, 2].map((i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
      {!loading && posts.length === 0 && (
        <p className="text-center text-muted-foreground py-12">No boosted posts. Boost a post to promote it to more people.</p>
      )}
      {posts.map((post) => <PostCard key={post.id} post={post} />)}
    </div>
  );
}
