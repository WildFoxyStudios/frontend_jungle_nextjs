"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { postsApi } from "@jungle/api-client";
import type { Post, Comment } from "@jungle/api-client";
import { Button, Card, CardContent, Separator, Skeleton } from "@jungle/ui";
import { PostCard } from "@/components/feed/PostCard";
import { CommentList } from "@/components/feed/CommentList";
import { CommentForm } from "@/components/feed/CommentForm";
import { Link2, Eye, ThumbsUp, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const REACTION_EMOJI: Record<string, string> = {
  like: "👍", love: "❤️", haha: "😂", wow: "😮", sad: "😢", angry: "😡",
};

export function PostDetailClient({ postId }: { postId: number }) {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCursor, setCommentCursor] = useState<string | undefined>();
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);

  useEffect(() => {
    postsApi.getPost(postId).then((p) => {
      setPost(p);
      postsApi.getExploreFeed()
        .then((r) => setRelatedPosts((r.data ?? []).filter((rp) => rp.id !== p.id).slice(0, 4)))
        .catch(() => { /* related posts are non-critical */ });
    }).catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load post"));
  }, [postId]);

  const loadComments = useCallback(async () => {
    if (!hasMoreComments || loadingComments) return;
    setLoadingComments(true);
    try {
      const r = await postsApi.getComments(postId, commentCursor);
      setComments((prev) => [...prev, ...(r.data ?? [])]);
      setCommentCursor(r.meta?.cursor);
      setHasMoreComments(r.meta?.has_more ?? false);
    } catch { /* silent */ }
    finally { setLoadingComments(false); }
  }, [postId, commentCursor, hasMoreComments, loadingComments]);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const handleNewComment = (comment: Comment) => {
    setComments((prev) => [comment, ...prev]);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    } catch { toast.error("Failed to copy"); }
  };

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  const allComments = [
    ...(post.recent_comments ?? []),
    ...comments.filter((c) => !post.recent_comments?.some((rc) => rc.id === c.id)),
  ];

  const totalReactions = Object.values(post.reaction_counts ?? {}).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
        <Link href="/"><ArrowLeft className="h-3.5 w-3.5" /> Back to feed</Link>
      </Button>

      <PostCard post={post} />

      {/* Stats + Actions */}
      <Card>
        <CardContent className="p-3 space-y-3">
          {/* Reaction breakdown */}
          {totalReactions > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {Object.entries(post.reaction_counts ?? {})
                  .filter(([, count]) => count > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <span key={type} className="inline-flex items-center gap-0.5 bg-muted rounded-full px-2 py-0.5 text-xs">
                      <span>{REACTION_EMOJI[type] ?? "👍"}</span>
                      <span className="font-medium">{count}</span>
                    </span>
                  ))}
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" /> {totalReactions} total
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopyLink}>
                <Link2 className="h-3.5 w-3.5" /> Copy Link
              </Button>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              {post.view_count > 0 && (
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {post.view_count.toLocaleString()} views</span>
              )}
              {post.share_count > 0 && (
                <span>{post.share_count} shares</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments section */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">
              Comments {post.comment_count > 0 && `(${post.comment_count})`}
            </h2>
          </div>
          <CommentForm postId={post.id} onSuccess={handleNewComment} />
          <Separator />
          {allComments.length > 0 ? (
            <CommentList comments={allComments} postId={post.id} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
          )}
          {hasMoreComments && (
            <Button variant="ghost" size="sm" className="w-full" onClick={loadComments} disabled={loadingComments}>
              {loadingComments ? "Loading…" : "Load more comments"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">You might also like</h3>
          {relatedPosts.map((rp) => (
            <PostCard key={rp.id} post={rp} />
          ))}
        </div>
      )}
    </div>
  );
}
