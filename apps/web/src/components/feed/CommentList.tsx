"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Comment } from "@jungle/api-client";
import { postsApi } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import {
 Avatar, AvatarFallback, AvatarImage,
 DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@jungle/ui";
import { MoreHorizontal, Trash2, Heart, Reply, Pencil, Check, X } from "lucide-react";
import { CommentForm } from "./CommentForm";
import { AudioPlayer } from "@/components/shared/AudioPlayer";
import { ParsedText } from "@/components/shared/ParsedText";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import { formatDistanceToNow } from "@/lib/date";

interface CommentListProps {
 comments: Comment[];
 postId: number;
 depth?: number;
}

export function CommentList({ comments, postId, depth = 0 }: CommentListProps) {
 const [localComments, setLocalComments] = useState(comments);

 const handleDelete = (commentId: number) => {
 setLocalComments((prev) => prev.filter((c) => c.id !== commentId));
 };

 const handleNewReply = (parentId: number, reply: Comment) => {
 setLocalComments((prev) =>
 prev.map((c) =>
 c.id === parentId
 ? { ...c, replies: [...(c.replies ?? []), reply], reply_count: (c.reply_count ?? 0) + 1 }
 : c
 )
 );
 };

 return (
 <div className={`space-y-3 ${depth > 0 ? "ml-10 pl-3 border-l-2 border-border-subtle" : ""}`}>
 {localComments.map((comment) => (
 <CommentItem
 key={comment.id}
 comment={comment}
 postId={postId}
 depth={depth}
 onDelete={handleDelete}
 onNewReply={handleNewReply}
 />
 ))}
 </div>
 );
}

function CommentItem({
 comment,
 postId,
 depth,
 onDelete,
 onNewReply,
}: {
 comment: Comment;
 postId: number;
 depth: number;
 onDelete: (id: number) => void;
 onNewReply: (parentId: number, reply: Comment) => void;
}) {
 const { user } = useAuthStore();
 const publisher = comment.publisher ?? {
 id: comment.user_id,
 username: "unknown",
 first_name: "User",
 last_name: "",
 avatar: "",
 is_verified: false,
 is_online: false,
 is_pro: 0,
 };
 const [showReply, setShowReply] = useState(false);
 const [liked, setLiked] = useState(!!comment.my_reaction);
 const [likeCount, setLikeCount] = useState(comment.like_count ?? 0);
 const [deleting, setDeleting] = useState(false);
 const [editing, setEditing] = useState(false);
 const [editContent, setEditContent] = useState(comment.content);
 const [displayContent, setDisplayContent] = useState(comment.content);

 const isOwn = user?.id === comment.user_id;

 const handleLike = async () => {
 try {
 if (liked) {
 await postsApi.removeCommentReaction(comment.id);
 setLiked(false);
 setLikeCount((c) => Math.max(0, c - 1));
 } else {
 await postsApi.reactToComment(comment.id, "like");
 setLiked(true);
 setLikeCount((c) => c + 1);
 }
 } catch { /* silent */ }
 };

 const handleDelete = async () => {
 setDeleting(true);
 try {
 await postsApi.deleteComment(comment.id);
 onDelete(comment.id);
 toast.success("Comment deleted");
 } catch {
 toast.error("Failed to delete comment");
 } finally {
 setDeleting(false);
 }
 };

 return (
 <div className="group flex gap-2 mb-3">
 <Link href={`/profile/${publisher.username}`}>
 <Avatar className="h-8 w-8 shrink-0 rounded-full">
 <AvatarImage src={resolveAvatarUrl(publisher.avatar)} />
 <AvatarFallback>{publisher.first_name?.[0]}</AvatarFallback>
 </Avatar>
 </Link>
 <div className="min-w-0 flex-1">
 <div className="relative bg-surface-sunken rounded-lg px-3 py-2 text-sm">
 <div className="flex flex-wrap items-center gap-1.5">
 <Link href={`/profile/${publisher.username}`} className="text-xs font-semibold hover:underline">
 {publisher.first_name} {publisher.last_name}
 </Link>
 <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(comment.created_at)}</span>
 </div>
 {editing ? (
 <div className="mt-1 flex items-center gap-1">
 <input
 value={editContent}
 onChange={(e) => setEditContent(e.target.value)}
 className="flex-1 border border-border-subtle bg-background px-3 py-1.5 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50"
 autoFocus
 />
 <button
 onClick={async () => {
 try {
 await postsApi.updateComment(comment.id, { content: editContent });
 setDisplayContent(editContent);
 setEditing(false);
 toast.success("Comment updated");
 } catch { toast.error("Failed to update"); }
 }}
 className="rounded-full p-1 hover:bg-primary/10"
 ><Check className="h-3.5 w-3.5 text-primary" /></button>
 <button
 onClick={() => { setEditing(false); setEditContent(displayContent); }}
 className="rounded-full p-1 hover:bg-destructive/10"
 ><X className="h-3.5 w-3.5" /></button>
 </div>
 ) : (
 <ParsedText text={displayContent} className="mt-1 text-sm whitespace-pre-wrap" />
 )}

 {comment.media && (
 <div className="mt-1">
 {comment.media.type === "image" ? (
 <Image
 src={comment.media.url}
 alt=""
 width={640}
 height={360}
 unoptimized
 className="h-auto max-h-40 w-auto rounded-lg"
 />
 ) : comment.media.type === "audio" ? (
 // CM3 — render voice comments with the shared audio player.
 <div className="max-w-sm">
 <AudioPlayer src={comment.media.url} title="Voice comment" />
 </div>
 ) : (
 <video src={comment.media.url} className="max-h-40 rounded-lg" controls />
 )}
 </div>
 )}

 {isOwn && (
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button className="absolute right-2 top-2 rounded-full p-1 opacity-0 transition-opacity hover:bg-surface-subtle group-hover:opacity-100">
 <MoreHorizontal className="h-3.5 w-3.5" />
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => setEditing(true)} className="gap-2">
 <Pencil className="h-3.5 w-3.5" /> Edit
 </DropdownMenuItem>
 <DropdownMenuItem onClick={handleDelete} disabled={deleting} className="text-destructive gap-2">
 <Trash2 className="h-3.5 w-3.5" /> Delete
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 )}
 </div>

 <div className="mt-1 flex items-center gap-3 pl-1 text-xs text-muted-foreground">
 <button
 type="button"
 onClick={handleLike}
 className={`flex items-center gap-1 hover:text-foreground ${liked ? "font-medium text-red-500" : ""}`}
 >
 <Heart className={`h-3 w-3 ${liked ? "fill-red-500" : ""}`} />
 {likeCount > 0 ? likeCount : "Like"}
 </button>
 {depth < 2 && (
 <button
 type="button"
 onClick={() => setShowReply(!showReply)}
 className="flex items-center gap-1 hover:text-foreground"
 >
 <Reply className="h-3 w-3" /> Reply
 </button>
 )}
 </div>

 {showReply && (
 <div className="mt-2">
 <CommentForm
 postId={postId}
 replyTo={comment.id}
 onSuccess={(reply) => {
 onNewReply(comment.id, reply);
 setShowReply(false);
 }}
 />
 </div>
 )}
 {comment.replies && comment.replies.length > 0 && depth < 2 && (
 <CommentList comments={comment.replies} postId={postId} depth={depth + 1} />
 )}
 </div>
 </div>
 );
}
