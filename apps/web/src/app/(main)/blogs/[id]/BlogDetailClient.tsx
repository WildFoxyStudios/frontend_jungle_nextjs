"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { blogsApi } from "@jungle/api-client";
import type { Blog } from "@jungle/api-client";
import {
  Skeleton, Badge, Avatar, AvatarFallback, AvatarImage, Button, Card, CardContent,
  Separator, Textarea,
} from "@jungle/ui";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import { Heart, MessageCircle, Eye, Share2, Calendar, Tag } from "lucide-react";

interface BlogComment {
  id: number;
  content: string;
  user: { username: string; first_name: string; last_name: string; avatar: string };
  created_at: string;
}

export function BlogDetailClient({ blogId }: { blogId: number }) {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reacted, setReacted] = useState(false);

  useEffect(() => {
    blogsApi.getBlog(blogId)
      .then(setBlog)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load blog"));
    blogsApi.getBlogComments(blogId)
      .then((r) => setComments(Array.isArray(r?.data) ? r.data as BlogComment[] : []))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load comments"));
  }, [blogId]);

  const handleReact = async () => {
    if (reacted) return;
    try {
      await blogsApi.reactToBlog(blogId, "like");
      setReacted(true);
      setBlog((b) => b ? { ...b, like_count: b.like_count + 1, my_reaction: "like" } : b);
    } catch { toast.error("Failed to react"); }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const c = await blogsApi.createBlogComment(blogId, newComment);
      setComments((prev) => [...prev, c as BlogComment]);
      setNewComment("");
      setBlog((b) => b ? { ...b, comment_count: b.comment_count + 1 } : b);
      toast.success("Comment posted");
    } catch { toast.error("Failed to post comment"); }
    finally { setSubmitting(false); }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await blogsApi.deleteBlogComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setBlog((b) => b ? { ...b, comment_count: Math.max(0, b.comment_count - 1) } : b);
      toast.success("Comment deleted");
    } catch { toast.error("Failed to delete comment"); }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch { /* silent */ }
  };

  if (!blog) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    );
  }

  const hasReacted = reacted || !!blog.my_reaction;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-6">
      {/* Cover */}
      {blog.cover && (
        <div className="relative h-64 bg-muted rounded-lg overflow-hidden">
          <img src={blog.cover} alt={blog.title} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      )}

      {/* Title */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">{blog.title}</h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <Link href={`/profile/${blog.author.username}`} className="flex items-center gap-2 hover:text-foreground">
            <Avatar className="h-7 w-7">
              <AvatarImage src={resolveAvatarUrl(blog.author.avatar)} />
              <AvatarFallback className="text-xs">{blog.author.first_name?.[0]}</AvatarFallback>
            </Avatar>
            <span>{blog.author.first_name} {blog.author.last_name}</span>
          </Link>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> {new Date(blog.created_at).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> {blog.view_count} views
          </span>
        </div>

        {/* Tags */}
        {(blog.tags.length > 0 || blog.category) && (
          <div className="flex gap-2 flex-wrap">
            {blog.category && <Badge variant="secondary">{blog.category}</Badge>}
            {blog.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="gap-1"><Tag className="h-3 w-3" /> {tag}</Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Content */}
      <article className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: blog.content }} />

      <Separator />

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button variant={hasReacted ? "default" : "outline"} size="sm" className="gap-1.5" onClick={handleReact}>
          <Heart className={`h-4 w-4 ${hasReacted ? "fill-current" : ""}`} /> {blog.like_count}
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5">
          <MessageCircle className="h-4 w-4" /> {blog.comment_count}
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
          <Share2 className="h-4 w-4" /> Share
        </Button>
      </div>

      {/* Comments */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Comments ({comments.length})</h2>

        {/* New comment */}
        <div className="flex gap-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment…"
            rows={2}
            className="flex-1"
          />
          <Button onClick={handleComment} disabled={submitting || !newComment.trim()} className="self-end">
            {submitting ? "Posting…" : "Post"}
          </Button>
        </div>

        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={resolveAvatarUrl(c.user?.avatar)} />
                      <AvatarFallback className="text-xs">{c.user?.first_name?.[0] ?? "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/profile/${c.user?.username}`} className="text-sm font-medium hover:underline">
                          {c.user?.first_name} {c.user?.last_name}
                        </Link>
                        <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm mt-0.5">{c.content}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive shrink-0"
                      onClick={() => handleDeleteComment(c.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
