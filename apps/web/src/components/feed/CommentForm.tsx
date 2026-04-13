"use client";

import { useState } from "react";
import { postsApi } from "@jungle/api-client";
import type { Comment } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import { Avatar, AvatarFallback, AvatarImage, Button, Input } from "@jungle/ui";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";

interface CommentFormProps {
  postId: number;
  replyTo?: number;
  onSuccess?: (comment: Comment) => void;
}

export function CommentForm({ postId, replyTo, onSuccess }: CommentFormProps) {
  const { user } = useAuthStore();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsLoading(true);
    try {
      const comment = await postsApi.createComment(postId, {
        content,
        reply_to: replyTo,
      });
      setContent("");
      onSuccess?.(comment);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={resolveAvatarUrl(user.avatar)} />
        <AvatarFallback>{user.first_name[0]}</AvatarFallback>
      </Avatar>
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment…"
        className="flex-1 h-8 text-sm"
        disabled={isLoading}
      />
      <Button type="submit" size="sm" disabled={isLoading || !content.trim()}>
        {isLoading ? "…" : "Post"}
      </Button>
    </form>
  );
}
