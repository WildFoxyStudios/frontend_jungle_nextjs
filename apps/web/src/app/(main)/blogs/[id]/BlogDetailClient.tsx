"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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

function sanitizeHtml(html: string): string {
 // Remove script tags and event handlers
 return html
 .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
 .replace(/ on\w+="[^"]*"/gi, '')
 .replace(/ on\w+='[^']*'/gi, '')
 .replace(/javascript:/gi, '')
 .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
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
 <div className="mx-auto max-w-3xl space-y-4 px-3 py-4 sm:px-4">
 <Skeleton className="h-64 w-full" />
 <Skeleton className="h-10 w-2/3" />
 <Skeleton className="h-4 w-1/3" />
 </div>
 );
 }

 const hasReacted = reacted || !!blog.my_reaction;

 return (
 <div className="mx-auto max-w-3xl space-y-6 px-3 py-4 sm:px-4">
 {/* Cover */}
 {blog.cover && (
 <div className="relative h-64 overflow-hidden border bg-muted">
 <Image src={blog.cover} alt={blog.title} fill priority unoptimized className="object-cover" />
 </div>
 )}

 {/* Title */}
 <div className="space-y-3">
 <h1 className="text-2xl font-bold sm:text-[28px]">{blog.title}</h1>

 {/* Meta */}
 <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
 <Link href={`/profile/${blog.author.username}`} className="flex items-center gap-2 hover:text-foreground">
 <Avatar className="h-7 w-7">
 <AvatarImage src={resolveAvatarUrl(blog.author.avatar)} />
 <AvatarFallback className="text-xs">{blog.author.first_name?.[0]}</AvatarFallback>
 </Avatar>
 <span className="font-semibold">{blog.author.first_name} {blog.author.last_name}</span>
 </Link>
 <span className="flex items-center gap-1 font-medium">
 <Calendar className="h-3.5 w-3.5" /> {new Date(blog.created_at).toLocaleDateString()}
 </span>
 <span className="flex items-center gap-1 font-medium">
 <Eye className="h-3.5 w-3.5" /> {blog.view_count} views
 </span>
 </div>

 {/* Tags */}
 {(blog.tags.length > 0 || blog.category) && (
 <div className="flex flex-wrap gap-2">
 {blog.category && <Badge variant="secondary">{blog.category}</Badge>}
 {blog.tags.map((tag) => (
 <span
 key={tag}
 className="inline-flex items-center gap-1 bg-muted/40 px-1.5 py-0.5 text-[13px] font-medium"
 >
 <Tag className="h-3 w-3" /> {tag}
 </span>
 ))}
 </div>
 )}
 </div>

 <Separator />

 {/* Content */}
 <article className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(blog.content) }} />

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
 <h2 className="text-[17px] font-semibold">Comments ({comments.length})</h2>

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
 <div className="py-12 text-center">
 <p className="text-[15px] font-semibold text-muted-foreground">No comments yet. Be the first!</p>
 </div>
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
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <Link href={`/profile/${c.user?.username}`} className="text-sm font-semibold hover:underline">
 {c.user?.first_name} {c.user?.last_name}
 </Link>
 <span className="text-[13px] font-medium text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
 </div>
 <p className="mt-0.5 text-sm">{c.content}</p>
 </div>
 <Button
 variant="ghost"
 size="sm"
 className="shrink-0 text-xs text-destructive"
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
