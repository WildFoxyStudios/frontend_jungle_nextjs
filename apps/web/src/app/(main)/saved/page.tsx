"use client";

import { useEffect, useState } from "react";
import { postsApi } from "@jungle/api-client";
import type { Post } from "@jungle/api-client";
import { Skeleton } from "@jungle/ui";
import { PostCard } from "@/components/feed/PostCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Bookmark } from "lucide-react";

export default function SavedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postsApi.getSavedPosts().then((r) => setPosts(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold">Saved Posts</h1>
      {loading ? <Skeleton className="h-48 w-full" /> : posts.map((p) => <PostCard key={p.id} post={p} />)}
      {!loading && posts.length === 0 && <EmptyState icon={Bookmark} title="No saved posts" description="Save posts to find them easily later." />}
    </div>
  );
}
