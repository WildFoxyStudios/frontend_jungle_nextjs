"use client";

import { useEffect, useState } from "react";
import { postsApi } from "@jungle/api-client";
import type { Post } from "@jungle/api-client";
import { Skeleton } from "@jungle/ui";
import { PostCard } from "@/components/feed/PostCard";
import { CommentList } from "@/components/feed/CommentList";
import { CommentForm } from "@/components/feed/CommentForm";

export function PostDetailClient({ postId }: { postId: number }) {
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    postsApi.getPost(postId).then(setPost).catch(() => {});
  }, [postId]);

  if (!post) return <Skeleton className="h-64 w-full max-w-2xl mx-auto mt-4" />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <PostCard post={post} />
      <div className="space-y-3">
        <h2 className="font-semibold">Comments</h2>
        <CommentForm postId={post.id} />
        {post.recent_comments && <CommentList comments={post.recent_comments} postId={post.id} />}
      </div>
    </div>
  );
}
