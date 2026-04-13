"use client";

import { use, useEffect, useState } from "react";
import { pagesApi } from "@jungle/api-client";
import { postsApi } from "@jungle/api-client";
import type { Page } from "@jungle/api-client";
import { Button, Avatar, AvatarFallback, AvatarImage, Skeleton } from "@jungle/ui";
import { PostCard } from "@/components/feed/PostCard";

interface Props { params: Promise<{ slug: string }> }

export default function PageDetailPage({ params }: Props) {
  const { slug } = use(params);
  const [page, setPage] = useState<Page | null>(null);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    pagesApi.getPage(slug).then(setPage).catch(() => {});
    postsApi.getFeed(undefined, "page").then((r) => setPosts(r.data)).catch(() => {});
  }, [slug]);

  if (!page) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16"><AvatarImage src={page.avatar} /><AvatarFallback>{page.name[0]}</AvatarFallback></Avatar>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{page.name}</h1>
          <p className="text-sm text-muted-foreground">{page.like_count} likes · ⭐ {page.rating.toFixed(1)}</p>
        </div>
        <Button variant={page.is_liked ? "outline" : "default"}>
          {page.is_liked ? "Unlike" : "Like"}
        </Button>
      </div>
      {page.description && <p className="text-sm">{page.description}</p>}
      <div className="space-y-4">{posts.map((p) => <PostCard key={p.id} post={p} />)}</div>
    </div>
  );
}
